import { z } from "zod";

export const EvidenceEdgeTypeEnum = z.enum([
  "ABOUT",
  "MENTIONS",
  "IS_PRIMARY_SOURCE",
]);

export type EvidenceEdgeType = z.infer<typeof EvidenceEdgeTypeEnum>;

export const EvidenceSourceRefResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Document"),
    documentId: z.string(),
  }),
  z.object({
    kind: z.literal("Chunk"),
    chunkId: z.string(),
  }),
]);

export type EvidenceSourceRefResult = z.infer<
  typeof EvidenceSourceRefResultSchema
>;

export const EvidenceTargetRefResolvedSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  uniqueKey: z.string().nullable().optional(),
  uniqueKeyValue: z.string().nullable().optional(),
});

export type EvidenceTargetRefResolved = z.infer<
  typeof EvidenceTargetRefResolvedSchema
>;


export const UpsertEvidenceEdgeResultSchema = z.object({
    ok: z.literal(true),
    edgeType: EvidenceEdgeTypeEnum,
    relKey: z.string(),
    relationshipId: z.string().nullable().optional(),
  
    source: EvidenceSourceRefResultSchema,
    target: EvidenceTargetRefResolvedSchema,
  
    created: z.boolean(),
    updated: z.boolean(),
  });
  
  export type UpsertEvidenceEdgeResult = z.infer<
    typeof UpsertEvidenceEdgeResultSchema
  >; 


  export const UpsertEvidenceEdgeErrorSchema = z.object({
    index: z.number().int(),
    edgeType: EvidenceEdgeTypeEnum.nullable().optional(),
    message: z.string(),
    code: z.string().nullable().optional(),
  });
  
  export type UpsertEvidenceEdgeError = z.infer<
    typeof UpsertEvidenceEdgeErrorSchema
  >;
  
  export const UpsertEvidenceEdgesCountsSchema = z.object({
    received: z.number().int(),
    attempted: z.number().int(),
    created: z.number().int(),
    updated: z.number().int(),
    failed: z.number().int(),
  });
  
  export type UpsertEvidenceEdgesCounts = z.infer<
    typeof UpsertEvidenceEdgesCountsSchema
  >;
  
  export const UpsertEvidenceEdgesResultSchema = z.object({
    ok: z.boolean(),
    counts: UpsertEvidenceEdgesCountsSchema,
    results: z.array(UpsertEvidenceEdgeResultSchema),
    errors: z.array(UpsertEvidenceEdgeErrorSchema),
  });
  
  export type UpsertEvidenceEdgesResult = z.infer<
    typeof UpsertEvidenceEdgesResultSchema
  >;
  