import mongoose, { Model, HydratedDocument, ClientSession } from "mongoose";
import { BaseService } from "./BaseService.js";
import { Product } from "../models/Product.js";
import { Compound } from "../models/Compound.js";
import { Article } from "../models/Article.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Episode } from "../models/Episode.js";
import type {
  IProtocolStepGroup,
  IProtocolStepItem,
  IEvidenceRef,
  ISafetyBucket,
} from "../models/ProtocolParts.js";
import {
  ProtocolStepGroupInput,
  EvidenceRefInput,
  SafetyBucketInput,
} from "../graphql/inputs/protocolPartsInputs.js";

/**
 * Base service for Protocol-related services that share common protocol
 * normalization and validation logic.
 *
 * Extends BaseService and provides shared methods for:
 * - Normalizing protocol step groups, evidence refs, and safety buckets
 * - Validating protocol steps and evidence references
 * - Collecting reference IDs from step structures
 */
export abstract class BaseProtocolService<
  TSchema,
  TDoc extends HydratedDocument<TSchema>,
  TModel extends Model<TSchema>
> extends BaseService<TSchema, TDoc, TModel> {
  /**
   * Normalizes protocol step groups from input format to database format.
   * Converts string IDs to ObjectIds and handles ACTION items.
   */
  protected normalizeStepsStructured(
    input: ProtocolStepGroupInput[] | undefined
  ): IProtocolStepGroup[] {
    if (!input) return [];

    return input.map<IProtocolStepGroup>((g) => ({
      label: g.label,
      timeOfDay: g.timeOfDay ?? "any",
      items: g.items.map<IProtocolStepItem>((it) => {
        if (it.type === "ACTION") {
          return {
            type: "ACTION",
            nameOverride: it.nameOverride,
            dosage: it.dosage,
            timing: it.timing,
            notes: it.notes,
          };
        }

        // PRODUCT / COMPOUND must have refId by zod
        return {
          type: it.type,
          refId: it.refId ? this.toObjectId(it.refId) : undefined,
          nameOverride: it.nameOverride,
          dosage: it.dosage,
          timing: it.timing,
          notes: it.notes,
        };
      }),
    }));
  }

  /**
   * Normalizes evidence references from input format to database format.
   * Converts string IDs to ObjectIds.
   */
  protected normalizeEvidenceRefs(
    input: EvidenceRefInput[] | undefined
  ): IEvidenceRef[] {
    if (!input) return [];

    return input.map<IEvidenceRef>((r) => ({
      type: r.type,
      refId: r.refId ? this.toObjectId(r.refId) : undefined,
      episodeId: r.episodeId ? this.toObjectId(r.episodeId) : undefined,
      timestamps: r.timestamps ?? [],
      label: r.label,
      url: r.url,
      notes: r.notes,
    }));
  }

  /**
   * Normalizes safety bucket from input format to database format.
   */
  protected normalizeSafetyBucket(
    safety: SafetyBucketInput | undefined
  ): ISafetyBucket | undefined {
    if (!safety) return undefined;
    return {
      warnings: safety.warnings ?? [],
      contraindications: safety.contraindications ?? [],
      interactions: safety.interactions ?? [],
      notes: safety.notes,
    };
  }

  /**
   * Collects product and compound IDs from step structure.
   * Returns deduplicated arrays of IDs.
   */
  protected collectStepRefIds(stepsStructured: ProtocolStepGroupInput[]): {
    productIds: string[];
    compoundIds: string[];
  } {
    const productIds: string[] = [];
    const compoundIds: string[] = [];

    for (const group of stepsStructured) {
      for (const item of group.items) {
        if (item.type === "PRODUCT" && item.refId) productIds.push(item.refId);
        if (item.type === "COMPOUND" && item.refId)
          compoundIds.push(item.refId);
      }
    }

    return {
      productIds: Array.from(new Set(productIds)),
      compoundIds: Array.from(new Set(compoundIds)),
    };
  }

  /**
   * Validates that all product and compound references in steps exist.
   */
  protected async validateStepsStructured(
    stepsStructured: ProtocolStepGroupInput[] | undefined,
    session: ClientSession
  ): Promise<void> {
    if (!stepsStructured?.length) return;

    const { productIds, compoundIds } = this.collectStepRefIds(stepsStructured);

    if (productIds.length) {
      await this.validateEntities(Product, productIds, "Product", { session });
    }
    if (compoundIds.length) {
      await this.validateEntities(Compound, compoundIds, "Compound", {
        session,
      });
    }
  }

  /**
   * Validates that all evidence references exist in their respective collections.
   */
  protected async validateEvidenceRefs(
    evidenceRefs: EvidenceRefInput[] | undefined,
    session: ClientSession
  ): Promise<void> {
    if (!evidenceRefs?.length) return;

    const episodeIds: string[] = [];
    const caseStudyIds: string[] = [];
    const articleIds: string[] = [];

    for (const ref of evidenceRefs) {
      if (ref.type === "external") continue;

      if (ref.type === "episode") {
        // allow either episodeId or refId for episode
        if (ref.episodeId) episodeIds.push(ref.episodeId);
        else if (ref.refId) episodeIds.push(ref.refId);
        continue;
      }

      if (ref.type === "caseStudy" && ref.refId) caseStudyIds.push(ref.refId);
      if (ref.type === "article" && ref.refId) articleIds.push(ref.refId);
    }

    const uniqEpisodeIds = Array.from(new Set(episodeIds));
    const uniqCaseStudyIds = Array.from(new Set(caseStudyIds));
    const uniqArticleIds = Array.from(new Set(articleIds));

    if (uniqEpisodeIds.length) {
      await this.validateEntities(Episode, uniqEpisodeIds, "Episode", {
        session,
      });
    }
    if (uniqCaseStudyIds.length) {
      await this.validateEntities(CaseStudy, uniqCaseStudyIds, "CaseStudy", {
        session,
      });
    }
    if (uniqArticleIds.length) {
      await this.validateEntities(Article, uniqArticleIds, "Article", {
        session,
      });
    }
  }
}
