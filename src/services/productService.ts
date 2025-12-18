import mongoose, { ClientSession } from "mongoose";
import {
  Product,
  IProduct,
  ProductDoc,
  ProductModel,
} from "../models/Product.js";
import { Business } from "../models/Business.js";
import { Compound } from "../models/Compound.js";
import { Protocol, ProtocolDoc } from "../models/Protocol.js";

import {
  ProductCreateWithOptionalIdsInput,
  ProductUpdateWithOptionalIdsInput,
  ProductUpdateRelationFieldsInput,
  ProductCompoundNestedInput,
  ProductProtocolNestedInput,
} from "../graphql/inputs/productInputs.js";

import {
  ProductCreateWithOptionalIdsInputSchema,
  ProductUpdateWithOptionalIdsInputSchema,
  ProductUpdateRelationFieldsInputSchema,
  ProductCompoundNestedInputSchema,
  ProductProtocolNestedInputSchema,
} from "../graphql/inputs/schemas/productSchemas.js";

import { validateInput } from "../lib/validation.js";
import { withTransaction } from "../lib/transactions.js";
import { BaseService } from "./BaseService.js";
import { Errors } from "../lib/errors.js";

import { toObjectIds } from "./utils/general.js";
import {
  mergeAndDedupeIds,
  mergeUniqueBy,
  mergeUniqueStrings,
} from "./utils/merging.js";
import { MediaLink } from "../models/MediaLink.js";

class ProductService extends BaseService<IProduct, ProductDoc, ProductModel> {
  constructor() {
    super(Product, "productService", "Product");
  }

  async createProductWithOptionalIds(
    input: ProductCreateWithOptionalIdsInput
  ): Promise<IProduct> {
    const validated = validateInput(
      ProductCreateWithOptionalIdsInputSchema,
      input,
      "ProductCreateWithOptionalIdsInput"
    );

    const {
      name,
      businessId,
      description,
      ingredients,
      mediaLinks,
      sourceUrl,
      compoundIds,
      protocolIds,
    } = validated;

    return withTransaction(
      async (session) => {
        await this.validateEntities(Business, [businessId], "Business", {
          session,
        });

        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
        }

        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
        }

        const businessObjectId = new mongoose.Types.ObjectId(businessId);

        const validMediaLinks: MediaLink[] | undefined = mediaLinks?.filter(
          (m): m is MediaLink => !!m.url
        );

        const [product] = await Product.create(
          [
            {
              name,
              businessId: businessObjectId,
              description,
              ingredients: ingredients ?? [],
              mediaLinks: validMediaLinks,
              sourceUrl,
              compoundIds: compoundIds ? toObjectIds(compoundIds) : [],

              protocolIds: [],
            },
          ],
          { session }
        );

        if (protocolIds?.length) {
          await Protocol.updateMany(
            { _id: { $in: protocolIds } },
            { $addToSet: { productIds: product._id } },
            { session }
          );
        }

        return product;
      },
      { operation: "createProductWithOptionalIds", productName: name }
    );
  }

  async updateProductWithOptionalIds(
    input: ProductUpdateWithOptionalIdsInput
  ): Promise<IProduct | null> {
    const validated = validateInput(
      ProductUpdateWithOptionalIdsInputSchema,
      input,
      "ProductUpdateWithOptionalIdsInput"
    );

    const {
      id,
      name,
      description,
      ingredients,
      mediaLinks,
      sourceUrl,
      compoundIds,
      protocolIds,
    } = validated;

    return withTransaction(
      async (session) => {
        const product = await this.findByIdOrNull(id, { session });
        if (!product) return null;

        // Scalars
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

        if (ingredients?.length) {
          product.ingredients = mergeUniqueStrings(
            product.ingredients ?? [],
            ingredients
          );
        }

        if (mediaLinks !== undefined) {
          const validMediaLinks = mediaLinks.filter(
            (m): m is MediaLink => !!m.url
          );
          product.mediaLinks = mergeUniqueBy(
            product.mediaLinks ?? [],
            validMediaLinks,
            (m: MediaLink) => m.url
          );
        }

        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
          product.compoundIds = mergeAndDedupeIds(
            product.compoundIds,
            compoundIds
          );
        }

        await product.save({ session });

        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
          await Protocol.updateMany(
            { _id: { $in: protocolIds } },
            { $addToSet: { productIds: product._id } },
            { session }
          );
        }

        return product;
      },
      { operation: "updateProductWithOptionalIds", productId: id }
    );
  }

  private async upsertCompoundsNested(
    compoundsNested: ProductCompoundNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!compoundsNested?.length) return [];

    const compoundIds: mongoose.Types.ObjectId[] = [];

    for (const raw of compoundsNested) {
      const validated = validateInput(
        ProductCompoundNestedInputSchema,
        raw,
        "ProductCompoundNestedInput"
      );

      const { id, name, description, aliases, mediaLinks } = validated;

      let compound: any | null = null;

      if (id) {
        compound = await Compound.findById(id).session(session);
        if (!compound && name) {
          compound = await Compound.findOne({ name }).session(session);
        }
      } else if (name) {
        compound = await Compound.findOne({ name }).session(session);
      }

      const validMediaLinks: MediaLink[] | undefined = mediaLinks?.filter(
        (m): m is MediaLink => !!m.url
      );

      if (compound) {
        if (name !== undefined) compound.name = name;
        if (description !== undefined) compound.description = description;
        if (aliases !== undefined) compound.aliases = aliases;
        if (mediaLinks !== undefined) compound.mediaLinks = validMediaLinks;

        await compound.save({ session });
      } else {
        if (!name) {
          throw Errors.validation(
            "compoundsNested entry requires 'name' when neither 'id' nor an existing compound by name is found",
            "name"
          );
        }

        const [created] = await Compound.create(
          [
            {
              name,
              description,
              aliases: aliases ?? [],
              mediaLinks: validMediaLinks,

              productIds: [],

              protocolIds: [],
            },
          ],
          { session }
        );

        compound = created;
      }

      compoundIds.push(compound._id);
    }

    return compoundIds;
  }

  private async upsertProtocolsNested(
    productId: mongoose.Types.ObjectId,
    protocolsNested: ProductProtocolNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!protocolsNested?.length) return [];

    const protocolIds: mongoose.Types.ObjectId[] = [];

    for (const raw of protocolsNested) {
      const validated = validateInput(
        ProductProtocolNestedInputSchema,
        raw,
        "ProductProtocolNestedInput"
      );

      const {
        id,
        name,
        description,
        categories,
        goals,
        steps,
        cautions,
        aliases,
        sourceUrl,
      } = validated;

      let protocol: ProtocolDoc | null = null;

      if (id) {
        protocol = await Protocol.findById(id).session(session);
        if (!protocol && name) {
          protocol = await Protocol.findOne({ name }).session(session);
        }
      } else if (name) {
        protocol = await Protocol.findOne({ name }).session(session);
      }

      if (protocol) {
        if (name !== undefined) protocol.name = name;
        if (description !== undefined) protocol.description = description;
        if (categories !== undefined) protocol.categories = categories;
        if (goals !== undefined) protocol.goals = goals;
        if (steps !== undefined) protocol.steps = steps;
        if (cautions !== undefined) protocol.cautions = cautions;
        if (aliases !== undefined) protocol.aliases = aliases;
        if (sourceUrl !== undefined) protocol.sourceUrl = sourceUrl;

        // Canonical attach: Protocol.productIds
        const current = protocol.productIds ?? [];
        protocol.productIds = mergeAndDedupeIds(current, [
          productId.toString(),
        ]);

        await protocol.save({ session });
      } else {
        if (!name) {
          throw Errors.validation(
            "protocolsNested entry requires 'name' when neither 'id' nor an existing protocol by name is found",
            "name"
          );
        }

        const [created] = await Protocol.create(
          [
            {
              name,
              description,
              categories,
              goals,
              steps,
              cautions,
              aliases,
              sourceUrl,
              productIds: [productId],

              compoundIds: [],
            },
          ],
          { session }
        );

        protocol = created;
      }

      protocolIds.push(protocol._id);
    }

    return protocolIds;
  }

  async updateProductWithRelationFields(
    input: ProductUpdateRelationFieldsInput
  ): Promise<IProduct | null> {
    const validated = validateInput(
      ProductUpdateRelationFieldsInputSchema,
      input,
      "ProductUpdateRelationFieldsInput"
    );

    const { id, compoundIds, compoundsNested, protocolIds, protocolsNested } =
      validated;

    return withTransaction(
      async (session) => {
        const product = await this.findByIdOrNull(id, { session });
        if (!product) return null;

        const productId = product._id;

        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
          product.compoundIds = mergeAndDedupeIds(
            product.compoundIds,
            compoundIds
          );
        }

        if (compoundsNested?.length) {
          const nestedCompoundIds = await this.upsertCompoundsNested(
            compoundsNested,
            session
          );
          product.compoundIds = mergeAndDedupeIds(
            product.compoundIds,
            nestedCompoundIds.map((x) => x.toString())
          );
        }

        await product.save({ session });

        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
          await Protocol.updateMany(
            { _id: { $in: protocolIds } },
            { $addToSet: { productIds: productId } },
            { session }
          );
        }

        if (protocolsNested?.length) {
          await this.upsertProtocolsNested(productId, protocolsNested, session);
          // Protocol hooks will recompute Product.protocolIds mirror.
        }

        return product;
      },
      { operation: "updateProductWithRelationFields", productId: id }
    );
  }

  async deleteProduct(id: string): Promise<IProduct | null> {
    return withTransaction(
      async (session) => {
        return await this.deleteById(id, { session });
      },
      { operation: "deleteProduct", productId: id }
    );
  }
}

export const productService = new ProductService();

export const createProductWithOptionalIds = (
  input: ProductCreateWithOptionalIdsInput
) => productService.createProductWithOptionalIds(input);

export const updateProductWithOptionalIds = (
  input: ProductUpdateWithOptionalIdsInput
) => productService.updateProductWithOptionalIds(input);

export const updateProductWithRelationFields = (
  input: ProductUpdateRelationFieldsInput
) => productService.updateProductWithRelationFields(input);

export const deleteProduct = (id: string) => productService.deleteProduct(id);
