import { z } from "zod";
import { ObjectIdSchema, OptionalUrlSchema } from "../../../lib/validation.js";

/**
 * Protocol scalar fields
 */

export const ProtocolStepItemTypeSchema = z.enum([
  "PRODUCT",
  "COMPOUND",
  "ACTION",
]);
export const ProtocolTimeOfDaySchema = z.enum([
  "morning",
  "midday",
  "evening",
  "bedtime",
  "any",
]);

export const EvidenceRefTypeSchema = z.enum([
  "episode",
  "caseStudy",
  "article",
  "external",
]);

export const ProtocolStepItemInputSchema = z
  .object({
    type: ProtocolStepItemTypeSchema,
    refId: ObjectIdSchema.optional(),
    nameOverride: z.string().min(1).max(200).optional(),
    dosage: z.string().max(200).optional(),
    timing: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "ACTION") {
      if (!val.nameOverride) {
        ctx.addIssue({
          code: "custom",
          message: "ACTION items require nameOverride",
          path: ["nameOverride"],
        });
      }
      if (val.refId) {
        ctx.addIssue({
          code: "custom",
          message: "ACTION items must not include refId",
          path: ["refId"],
        });
      }
      return;
    }

    // PRODUCT/COMPOUND must have refId
    if (!val.refId) {
      ctx.addIssue({
        code: "custom",
        message: `${val.type} items require refId`,
        path: ["refId"],
      });
    }
  });

export const EvidenceRefInputSchema = z
  .object({
    type: EvidenceRefTypeSchema,
    refId: ObjectIdSchema.optional(),
    episodeId: ObjectIdSchema.optional(),
    timestamps: z.array(z.number().int().nonnegative()).optional(),
    label: z.string().max(200).optional(),
    url: OptionalUrlSchema.optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "external") {
      if (!val.url) {
        ctx.addIssue({
          code: "custom",
          message: "external evidence requires url",
          path: ["url"],
        });
      }
      return;
    }

    // episode can be either episodeId or refId (choose one)
    if (val.type === "episode") {
      if (!val.episodeId && !val.refId) {
        ctx.addIssue({
          code: "custom",
          message: "episode evidence requires episodeId or refId",
          path: ["episodeId"],
        });
      }
      return;
    }

    // caseStudy/article must have refId
    if (!val.refId) {
      ctx.addIssue({
        code: "custom",
        message: `${val.type} evidence requires refId`,
        path: ["refId"],
      });
    }
  });

export const ProtocolStepGroupInputSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  timeOfDay: ProtocolTimeOfDaySchema.optional(),
  items: z
    .array(ProtocolStepItemInputSchema)
    .min(1, "Step group must have at least one item"),
});

export const SafetyBucketInputSchema = z.object({
  warnings: z.array(z.string().min(1)).optional(),
  contraindications: z.array(z.string().min(1)).optional(),
  interactions: z.array(z.string().min(1)).optional(),
  notes: z.string().max(5000).optional(),
});
