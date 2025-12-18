import mongoose, { ClientSession } from "mongoose";
import {
  Compound,
  ICompound,
  CompoundDoc,
  CompoundModel,
} from "../models/Compound.js";
import { Product } from "../models/Product.js";

import {
  CompoundCreateWithOptionalIdsInput,
  CompoundUpdateWithOptionalIdsInput,
  CompoundUpdateRelationFieldsInput,
  CompoundProductNestedInput,
} from "../graphql/inputs/compoundInputs.js";

import {
  CompoundCreateWithOptionalIdsInputSchema,
  CompoundUpdateWithOptionalIdsInputSchema,
  CompoundUpdateRelationFieldsInputSchema,
  CompoundProductNestedInputSchema,
} from "../graphql/inputs/schemas/compoundSchemas.js";

import { BaseService } from "./BaseService.js";
import { withTransaction } from "../lib/transactions.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";
import { mergeUniqueStrings, mergeUniqueBy } from "./utils/merging.js";
import { MediaLink } from "../models/MediaLink.js";

class CompoundService extends BaseService<
  ICompound,
  CompoundDoc,
  CompoundModel
> {
  constructor() {
    super(Compound, "compoundService", "Compound");
  }

  async createCompoundWithOptionalIds(
    input: CompoundCreateWithOptionalIdsInput
  ): Promise<ICompound> {
    const validated = validateInput(
      CompoundCreateWithOptionalIdsInputSchema,
      input,
      "CompoundCreateWithOptionalIdsInput"
    );

    const { name, description, aliases, mediaLinks, productIds } = validated;

    return withTransaction(
      async (session) => {
        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });
        }

        const validMediaLinks: MediaLink[] | undefined = mediaLinks?.filter(
          (m): m is MediaLink => !!m.url
        );

        const [compound] = await Compound.create(
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

        const compoundId = compound._id;

        if (productIds?.length) {
          await Product.updateMany(
            { _id: { $in: productIds } },
            { $addToSet: { compoundIds: compoundId } },
            { session }
          );

          await Compound.syncProductsForCompound(compoundId, { session });
        }

        return compound;
      },
      { operation: "createCompoundWithOptionalIds", compoundName: name }
    );
  }

  async updateCompoundWithOptionalIds(
    input: CompoundUpdateWithOptionalIdsInput
  ): Promise<ICompound | null> {
    const validated = validateInput(
      CompoundUpdateWithOptionalIdsInputSchema,
      input,
      "CompoundUpdateWithOptionalIdsInput"
    );

    const { id, name, description, aliases, mediaLinks, productIds } =
      validated;

    return withTransaction(
      async (session) => {
        const compound = await this.findByIdOrNull(id, { session });
        if (!compound) return null;

        // Scalars
        if (name !== undefined) compound.name = name;
        if (description !== undefined) compound.description = description;

        if (aliases?.length) {
          compound.aliases = mergeUniqueStrings(
            compound.aliases ?? [],
            aliases
          );
        }

        if (mediaLinks !== undefined) {
          const valid = mediaLinks.filter((m): m is MediaLink => !!m.url);
          compound.mediaLinks = mergeUniqueBy(
            compound.mediaLinks ?? [],
            valid,
            (m: MediaLink) => m.url
          );
        }

        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });

          await Product.updateMany(
            { _id: { $in: productIds } },
            { $addToSet: { compoundIds: compound._id } },
            { session }
          );

          await Compound.syncProductsForCompound(compound._id, { session });
        }

        await compound.save({ session });
        return compound;
      },
      { operation: "updateCompoundWithOptionalIds", compoundId: id }
    );
  }

  private async upsertProductsNested(
    compoundId: mongoose.Types.ObjectId,
    productsNested: CompoundProductNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!productsNested?.length) return [];

    const ids: mongoose.Types.ObjectId[] = [];

    for (const raw of productsNested) {
      const validated = validateInput(
        CompoundProductNestedInputSchema,
        raw,
        "CompoundProductNestedInput"
      );

      const { id, name, description, ingredients, mediaLinks, sourceUrl } =
        validated;

      let product: any | null = null;

      if (id) {
        product = await Product.findById(id).session(session);
        if (!product && name)
          product = await Product.findOne({ name }).session(session);
      } else if (name) {
        product = await Product.findOne({ name }).session(session);
      }

      if (!product) {
        throw Errors.validation(
          "Cannot create a new product from Compound nested input (Product.businessId is required). Provide an existing product id (or create product separately).",
          "productsNested"
        );
      }

      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (ingredients?.length) product.ingredients = ingredients;

      if (mediaLinks !== undefined) {
        const valid = mediaLinks.filter((m): m is MediaLink => !!m.url);
        product.mediaLinks = mergeUniqueBy(
          product.mediaLinks ?? [],
          valid,
          (m: MediaLink) => m.url
        );
      }

      if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

      if (
        !product.compoundIds?.some((cid: mongoose.Types.ObjectId) =>
          cid.equals(compoundId)
        )
      ) {
        product.compoundIds = [...(product.compoundIds ?? []), compoundId];
      }

      await product.save({ session });
      ids.push(product._id);
    }

    return ids;
  }

  async updateCompoundWithRelationFields(
    input: CompoundUpdateRelationFieldsInput
  ): Promise<ICompound | null> {
    const validated = validateInput(
      CompoundUpdateRelationFieldsInputSchema,
      input,
      "CompoundUpdateRelationFieldsInput"
    );

    const { id, productIds, productsNested } = validated;

    return withTransaction(
      async (session) => {
        const compound = await this.findByIdOrNull(id, { session });
        if (!compound) return null;

        const compoundId = compound._id;

        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });

          await Product.updateMany(
            { _id: { $in: productIds } },
            { $addToSet: { compoundIds: compoundId } },
            { session }
          );

          await Compound.syncProductsForCompound(compoundId, { session });
        }

        if (productsNested?.length) {
          await this.upsertProductsNested(compoundId, productsNested, session);

          await Compound.syncProductsForCompound(compoundId, { session });
        }

        return compound;
      },
      { operation: "updateCompoundWithRelationFields", compoundId: id }
    );
  }

  async deleteCompound(id: string): Promise<ICompound | null> {
    return withTransaction(
      async (session) => {
        return await this.deleteById(id, { session });
      },
      { operation: "deleteCompound", compoundId: id }
    );
  }
}

export const compoundService = new CompoundService();

export const createCompoundWithOptionalIds = (
  input: CompoundCreateWithOptionalIdsInput
) => compoundService.createCompoundWithOptionalIds(input);

export const updateCompoundWithOptionalIds = (
  input: CompoundUpdateWithOptionalIdsInput
) => compoundService.updateCompoundWithOptionalIds(input);

export const updateCompoundWithRelationFields = (
  input: CompoundUpdateRelationFieldsInput
) => compoundService.updateCompoundWithRelationFields(input);

export const deleteCompound = (id: string) =>
  compoundService.deleteCompound(id);
