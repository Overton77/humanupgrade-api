import mongoose, { ClientSession } from "mongoose";
import {
  Protocol,
  IProtocol,
  ProtocolDoc,
  ProtocolModel,
} from "../models/Protocol.js";
import { Product } from "../models/Product.js";
import { Compound } from "../models/Compound.js";
import { Business } from "../models/Business.js";
import { Article } from "../models/Article.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Episode } from "../models/Episode.js";
import type { IEvidenceRef } from "../models/ProtocolParts.js";
import { withTransaction } from "../lib/transactions.js";

import {
  ProtocolCreateWithOptionalIdsInput,
  ProtocolUpdateWithOptionalIdsInput,
  ProtocolUpdateRelationFieldsInput,
  ProtocolProductNestedInput,
  ProtocolCompoundNestedInput,
} from "../graphql/inputs/protocolInputs.js";

import {
  ProtocolCreateWithOptionalIdsInputSchema,
  ProtocolUpdateWithOptionalIdsInputSchema,
  ProtocolUpdateRelationFieldsInputSchema,
  ProtocolProductNestedInputSchema,
  ProtocolCompoundNestedInputSchema,
} from "../graphql/inputs/schemas/protocolSchemas.js";

import { validateInput } from "../lib/validation.js";
import { BaseProtocolService } from "./BaseProtocolService.js";
import { Errors } from "../lib/errors.js";

import {
  mergeAndDedupeIds,
  mergeUniqueStrings,
  mergeUniqueBy,
} from "./utils/merging.js";
import { MediaLink } from "../models/MediaLink.js";

class ProtocolService extends BaseProtocolService<
  IProtocol,
  ProtocolDoc,
  ProtocolModel
> {
  constructor() {
    super(Protocol, "protocolService", "Protocol");
  }

  async createProtocolWithOptionalIds(
    input: ProtocolCreateWithOptionalIdsInput
  ): Promise<IProtocol> {
    const validated = validateInput(
      ProtocolCreateWithOptionalIdsInputSchema,
      input,
      "ProtocolCreateWithOptionalIdsInput"
    );

    const {
      name,
      description,
      categories,
      goals,
      steps,
      cautions,
      aliases,
      sourceUrl,
      productIds,
      compoundIds,
      stepsStructured,
      evidenceRefs,
      safety,
    } = validated;

    return withTransaction(
      async (session) => {
        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });
        }
        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
        }
        if (stepsStructured?.length) {
          await this.validateStepsStructured(stepsStructured, session);
        }
        if (evidenceRefs?.length) {
          await this.validateEvidenceRefs(evidenceRefs, session);
        }

        const [protocol] = await Protocol.create(
          [
            {
              name,
              description,
              categories,
              goals,
              steps,
              cautions: cautions ?? [],
              aliases: aliases ?? [],
              stepsStructured: this.normalizeStepsStructured(stepsStructured),
              evidenceRefs: this.normalizeEvidenceRefs(evidenceRefs),
              safety: this.normalizeSafetyBucket(safety),
              sourceUrl,
              productIds: productIds
                ? productIds.map((id) => new mongoose.Types.ObjectId(id))
                : [],
              compoundIds: compoundIds
                ? compoundIds.map((id) => new mongoose.Types.ObjectId(id))
                : [],
            },
          ],
          { session }
        );

        // No explicit mirror sync calls; Protocol hooks do it.
        return protocol;
      },
      { operation: "createProtocolWithOptionalIds", protocolName: name }
    );
  }

  async updateProtocolWithOptionalIds(
    input: ProtocolUpdateWithOptionalIdsInput
  ): Promise<IProtocol | null> {
    const validated = validateInput(
      ProtocolUpdateWithOptionalIdsInputSchema,
      input,
      "ProtocolUpdateWithOptionalIdsInput"
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
      productIds,
      compoundIds,
      stepsStructured,
      addToEvidenceRefs,
      overwriteEvidenceRefs,
      evidenceRefs,
      safety,
    } = validated;

    return withTransaction(
      async (session) => {
        const protocol = await this.findByIdOrNull(id, { session });
        if (!protocol) return null;

        // Scalars
        if (name !== undefined) protocol.name = name;
        if (description !== undefined) protocol.description = description;
        if (categories !== undefined) protocol.categories = categories;
        if (goals !== undefined) protocol.goals = goals;
        if (steps !== undefined) protocol.steps = steps;
        if (cautions !== undefined) protocol.cautions = cautions;
        if (aliases !== undefined) protocol.aliases = aliases;
        if (sourceUrl !== undefined) protocol.sourceUrl = sourceUrl;

        // Canonical relations
        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });
          protocol.productIds = mergeAndDedupeIds(
            protocol.productIds,
            productIds
          );
        }

        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
          protocol.compoundIds = mergeAndDedupeIds(
            protocol.compoundIds,
            compoundIds
          );
        }

        if (stepsStructured?.length) {
          await this.validateStepsStructured(stepsStructured, session);
        }

        if (evidenceRefs?.length) {
          await this.validateEvidenceRefs(evidenceRefs, session);
        }

        const normalizedSteps =
          stepsStructured === undefined
            ? undefined
            : this.normalizeStepsStructured(stepsStructured);
        const normalizedEvidence =
          evidenceRefs === undefined
            ? undefined
            : this.normalizeEvidenceRefs(evidenceRefs);
        const normalizedSafety =
          safety === undefined ? undefined : this.normalizeSafetyBucket(safety);

        if (normalizedSteps !== undefined)
          protocol.stepsStructured = normalizedSteps;

        if (normalizedEvidence !== undefined) {
          const doAdd = addToEvidenceRefs === true;
          const doOverwrite = overwriteEvidenceRefs === true || !doAdd;

          if (doAdd) {
            protocol.evidenceRefs = mergeUniqueBy(
              protocol.evidenceRefs ?? [],
              normalizedEvidence,
              (e: IEvidenceRef) => {
                const ref = e.refId?.toHexString() ?? "";
                const ep = e.episodeId?.toHexString() ?? "";
                const url = e.url ?? "";
                return `${e.type}:${ref}:${ep}:${url}`;
              }
            );
          } else if (doOverwrite) {
            protocol.evidenceRefs = normalizedEvidence;
          }
        }

        if (normalizedSafety !== undefined) {
          protocol.safety = normalizedSafety;
        }

        await protocol.save({ session });
        return protocol;
      },
      { operation: "updateProtocolWithOptionalIds", protocolId: id }
    );
  }

  private async upsertProductsNested(
    productsNested: ProtocolProductNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!productsNested?.length) return [];

    const ids: mongoose.Types.ObjectId[] = [];

    for (const raw of productsNested) {
      const validated = validateInput(
        ProtocolProductNestedInputSchema,
        raw,
        "ProtocolProductNestedInput"
      );

      const {
        id,
        name,
        businessId,
        description,
        ingredients,
        price,
        mediaLinks,
        sourceUrl,
      } = validated;

      let product: any | null = null;

      if (id) {
        product = await Product.findById(id).session(session);
        if (!product && name)
          product = await Product.findOne({ name }).session(session);
      } else if (name) {
        product = await Product.findOne({ name }).session(session);
      }

      const validMediaLinks: MediaLink[] | undefined = mediaLinks?.filter(
        (m): m is MediaLink => !!m.url
      );

      if (product) {
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;

        if (ingredients?.length) {
          product.ingredients = mergeUniqueStrings(
            product.ingredients ?? [],
            ingredients
          );
        }

        if (price !== undefined) product.price = price;
        if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

        if (mediaLinks !== undefined) {
          product.mediaLinks = mergeUniqueBy(
            product.mediaLinks ?? [],
            validMediaLinks ?? [],
            (m: MediaLink) => m.url
          );
        }

        if (businessId) {
          await this.validateEntities(Business, [businessId], "Business", {
            session,
          });
          product.businessId = new mongoose.Types.ObjectId(businessId);
        }

        await product.save({ session });
      } else {
        if (!name) {
          throw Errors.validation(
            "productsNested entry requires 'name' when neither 'id' nor an existing product by name is found",
            "name"
          );
        }
        if (!businessId) {
          throw Errors.validation(
            "businessId is required when creating a new product",
            "businessId"
          );
        }

        await this.validateEntities(Business, [businessId], "Business", {
          session,
        });

        const [created] = await Product.create(
          [
            {
              name,
              description,
              ingredients: ingredients ?? [],
              price,
              mediaLinks: validMediaLinks,
              sourceUrl,
              businessId: new mongoose.Types.ObjectId(businessId),
              compoundIds: [],
              protocolIds: [],
            },
          ],
          { session }
        );
        product = created;
      }

      ids.push(product._id);
    }

    return ids;
  }

  private async upsertCompoundsNested(
    compoundsNested: ProtocolCompoundNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!compoundsNested?.length) return [];

    const ids: mongoose.Types.ObjectId[] = [];

    for (const raw of compoundsNested) {
      const validated = validateInput(
        ProtocolCompoundNestedInputSchema,
        raw,
        "ProtocolCompoundNestedInput"
      );

      const { id, name, description, aliases, mediaLinks } = validated;

      let compound: any | null = null;

      if (id) {
        compound = await Compound.findById(id).session(session);
        if (!compound && name)
          compound = await Compound.findOne({ name }).session(session);
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

      ids.push(compound._id);
    }

    return ids;
  }

  async updateProtocolWithRelationFields(
    input: ProtocolUpdateRelationFieldsInput
  ): Promise<IProtocol | null> {
    const validated = validateInput(
      ProtocolUpdateRelationFieldsInputSchema,
      input,
      "ProtocolUpdateRelationFieldsInput"
    );

    const { id, productIds, productsNested, compoundIds, compoundsNested } =
      validated;

    return withTransaction(
      async (session) => {
        const protocol = await this.findByIdOrNull(id, { session });
        if (!protocol) return null;

        // IDs: add-only (canonical)
        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product", {
            session,
          });
          protocol.productIds = mergeAndDedupeIds(
            protocol.productIds,
            productIds
          );
        }

        if (compoundIds?.length) {
          await this.validateEntities(Compound, compoundIds, "Compound", {
            session,
          });
          protocol.compoundIds = mergeAndDedupeIds(
            protocol.compoundIds,
            compoundIds
          );
        }

        // Nested upserts
        if (productsNested?.length) {
          const nestedIds = await this.upsertProductsNested(
            productsNested,
            session
          );
          protocol.productIds = mergeAndDedupeIds(
            protocol.productIds,
            nestedIds.map((x) => x.toString())
          );
        }

        if (compoundsNested?.length) {
          const nestedIds = await this.upsertCompoundsNested(
            compoundsNested,
            session
          );
          protocol.compoundIds = mergeAndDedupeIds(
            protocol.compoundIds,
            nestedIds.map((x) => x.toString())
          );
        }

        await protocol.save({ session });

        return protocol;
      },
      { operation: "updateProtocolWithRelationFields", protocolId: id }
    );
  }

  async deleteProtocol(id: string): Promise<ProtocolDoc | null> {
    return withTransaction(
      async (session) => {
        return await this.deleteById(id, { session });
      },
      { operation: "deleteProtocol", protocolId: id }
    );
  }
}

export const protocolService = new ProtocolService();

export const createProtocolWithOptionalIds = (
  input: ProtocolCreateWithOptionalIdsInput
) => protocolService.createProtocolWithOptionalIds(input);

export const updateProtocolWithOptionalIds = (
  input: ProtocolUpdateWithOptionalIdsInput
) => protocolService.updateProtocolWithOptionalIds(input);

export const updateProtocolWithRelationFields = (
  input: ProtocolUpdateRelationFieldsInput
) => protocolService.updateProtocolWithRelationFields(input);
