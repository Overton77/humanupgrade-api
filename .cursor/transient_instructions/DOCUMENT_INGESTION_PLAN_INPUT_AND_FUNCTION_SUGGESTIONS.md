Shared input primitives

These mirror your existing Neo4jDateTimeString + temporal fields.

import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

/**
 * Matches your TemporalValiditySchema usage: all fields present on nodes/edges.
 * (Your type schemas show these as non-null, so inputs should require them.)
 */
export const TemporalValidityInputSchema = z.object({
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString,
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});
export type TemporalValidityInput = z.infer<typeof TemporalValidityInputSchema>;

1) upsertResearchPlanRef(input)
Input schema (matches ResearchPlanRefSchema properties)
export const UpsertResearchPlanRefInputSchema = TemporalValidityInputSchema.extend({
  mongoPlanId: z.string(),          // unique
  label: z.string().nullable(),
  version: z.string().nullable(),
});
export type UpsertResearchPlanRefInput = z.infer<typeof UpsertResearchPlanRefInputSchema>;

How the function works

Idempotency key: mongoPlanId

Upserts ResearchPlanRef node fields exactly: mongoPlanId, label, version + temporal/audit fields.

Returns researchPlanRefId (your internal researchPlanRefId string).

2) upsertResearchRunRef(input)
Input schema (matches ResearchRunRefSchema properties)
export const UpsertResearchRunRefInputSchema = TemporalValidityInputSchema.extend({
  mongoRunId: z.string(),           // unique
  label: z.string().nullable(),
  startedAt: Neo4jDateTimeString,
  endedAt: Neo4jDateTimeString,
});
export type UpsertResearchRunRefInput = z.infer<typeof UpsertResearchRunRefInputSchema>;

How the function works

Idempotency key: mongoRunId

Upserts ResearchRunRef with mongoRunId, label, startedAt, endedAt + temporal/audit fields.

Returns researchRunRefId.

3) linkResearchRunUsesPlan(input) (ResearchRunRef → ResearchPlanRef)

Your type model represents this as:

Relationship edge has temporal validity

Relationship stores researchPlanRef (node) inside the edge object at query time

For write, keep it connect-only by the natural keys.

Input schema
export const LinkResearchRunUsesPlanInputSchema = TemporalValidityInputSchema.extend({
  mongoRunId: z.string(),
  mongoPlanId: z.string(),
});
export type LinkResearchRunUsesPlanInput = z.infer<typeof LinkResearchRunUsesPlanInputSchema>;

How the function works

Finds ResearchRunRef by mongoRunId

Finds ResearchPlanRef by mongoPlanId

MERGEs (run)-[:USES_PLAN]->(plan) and stamps the relationship temporal fields.

4) upsertDocument(input) (raw or summary)

Your DocumentSchema requires:

documentKey, type, title, url, publishedAt, retrievedAt

all temporal fields non-null

generatedBy is an array of GeneratedByEdge at query time

You said you already have GeneratedBy edge on Document and want to consolidate provenance there. So upsertDocument should optionally create/update a GENERATED_BY edge to a ResearchRunRef node.

GeneratedBy relationship input (matches GeneratedByEdgeSchema properties)
export const DocumentGeneratedByInputSchema = TemporalValidityInputSchema.extend({
  mongoRunId: z.string(),                 // points to ResearchRunRef.mongoRunId
  operation: z.string(),                  // CREATED | UPDATED | EXTRACTED | LINKED | SUMMARIZED | EMBEDDED
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
});
export type DocumentGeneratedByInput = z.infer<typeof DocumentGeneratedByInputSchema>;

Document upsert input (matches DocumentSchema properties)
export const UpsertDocumentInputSchema = TemporalValidityInputSchema.extend({
  documentKey: z.string(),        // unique idempotency key
  type: z.string(),               // case_study | case_study_summary | transcript | ...
  title: z.string().nullable(),
  url: z.string().nullable(),
  publishedAt: Neo4jDateTimeString,
  retrievedAt: Neo4jDateTimeString,

  // Optional: create/update Document-[:GENERATED_BY]->ResearchRunRef
  generatedBy: DocumentGeneratedByInputSchema.nullable().optional(),
});
export type UpsertDocumentInput = z.infer<typeof UpsertDocumentInputSchema>;

How the function works

Idempotency key: documentKey

Upserts Document node scalar fields exactly as in DocumentSchema.

If generatedBy is provided:

looks up ResearchRunRef by mongoRunId

MERGEs (:Document)-[:GENERATED_BY]->(:ResearchRunRef)

stamps relationship with operation, stageKey, subStageKey, extractorVersion, extractedAt + temporal fields

Returns documentId.

Note: Document’s generatedBy is an array in the type schema, but for ingestion you’ll usually write one edge per run stage. If you want multiple, you can either call upsertDocument multiple times or add a batch mutation later (upsertDocumentGeneratedByEdges).

5) upsertDocumentTextVersionBundle(input) ✅ workhorse (Document → TextVersion → Segmentation → Chunks)

Your type schemas require these properties:

DocumentTextVersion

textVersionHash, source, language, text + temporal

Segmentation

segmentationHash, strategy, chunkSize, overlap + temporal

Chunk

chunkKey, index, text, offsets, transcript times, embedding fields + temporal

And your Document has:

hasTextVersion: HasTextVersionEdge[] where edge carries documentTextVersion and temporal fields

chunks: HasChunkEdge[] where edge carries chunk and temporal fields (denormalized)

chunk has nextChunk: NextChunkEdge (single) at query time

So the bundle mutation should:

upsert the nodes

create structural edges

optionally create Document-[:HAS_CHUNK]->Chunk

optionally create Chunk-[:NEXT_CHUNK]->Chunk

Bundle input schemas
TextVersion input
export const DocumentTextVersionInputSchema = TemporalValidityInputSchema.extend({
  textVersionHash: z.string(),
  source: z.string(),
  language: z.string().nullable(),
  text: z.string(),
});
export type DocumentTextVersionInput = z.infer<typeof DocumentTextVersionInputSchema>;

Segmentation input
export const SegmentationInputSchema = TemporalValidityInputSchema.extend({
  segmentationHash: z.string(),
  strategy: z.string(),
  chunkSize: z.number().int(),
  overlap: z.number().int(),
});
export type SegmentationInput = z.infer<typeof SegmentationInputSchema>;

Chunk input (matches ChunkSchema fields exactly)
export const ChunkInputSchema = TemporalValidityInputSchema.extend({
  chunkKey: z.string(),
  index: z.number().int(),
  text: z.string(),

  charStart: z.number().int().nullable(),
  charEnd: z.number().int().nullable(),

  startMs: z.number().int().nullable(),
  endMs: z.number().int().nullable(),

  embedding: z.array(z.number()).nullable(),
  embeddingModel: z.string().nullable(),
  embeddingVersion: z.string().nullable(),
});
export type ChunkInput = z.infer<typeof ChunkInputSchema>;

Bundle input
export const UpsertDocumentTextVersionBundleInputSchema = z.object({
  documentId: z.string(), // Document.documentId returned from upsertDocument

  // node payloads
  textVersion: DocumentTextVersionInputSchema,
  segmentation: SegmentationInputSchema,
  chunks: z.array(ChunkInputSchema).min(1),

  // structural edge stamping (since your edge schemas have temporal fields)
  hasTextVersionEdge: TemporalValidityInputSchema,
  hasSegmentationEdge: TemporalValidityInputSchema,
  segmentationHasChunkEdge: TemporalValidityInputSchema,
  documentHasChunkEdge: TemporalValidityInputSchema.nullable().optional(),
  nextChunkEdge: TemporalValidityInputSchema.nullable().optional(),

  alsoCreateDocumentHasChunkEdges: z.boolean().optional().default(true),
  alsoCreateNextChunkEdges: z.boolean().optional().default(true),
});
export type UpsertDocumentTextVersionBundleInput = z.infer<
  typeof UpsertDocumentTextVersionBundleInputSchema
>;

How the function works

Upserts DocumentTextVersion by textVersionHash.

Connects (Document)-[:HAS_TEXT_VERSION]->(DocumentTextVersion) using the provided edge temporal fields (hasTextVersionEdge).

Upserts Segmentation by segmentationHash.

Connects (DocumentTextVersion)-[:HAS_SEGMENTATION]->(Segmentation) using hasSegmentationEdge.

Upserts Chunk by chunkKey and stores embeddings directly on the Chunk node (Neo4j native vectors).

Connects (Segmentation)-[:HAS_CHUNK]->(Chunk) using segmentationHasChunkEdge.

If enabled, also connects (Document)-[:HAS_CHUNK]->(Chunk) using documentHasChunkEdge (denormalized fast lookup).

If enabled, creates (Chunk)-[:NEXT_CHUNK]->(Chunk) using nextChunkEdge (ordered by index within this segmentation).

Returns:

documentTextVersionId

segmentationId

chunkMetas: [{ chunkId, chunkKey, index }]

Why explicit edge validity inputs?
Because your type schemas represent these edges as TemporalValiditySchema-wrapped edge objects. If you want these temporal fields on the relationships, the bundle needs to be able to stamp them deterministically.

If you want to simplify: you can remove the explicit edge validity blocks and instead have the API stamp edge temporal fields from textVersion.validAt or segmentation.validAt. But I’m matching your current modeling literally.

6) upsertEvidenceEdges(edges[]) (connect-only, Chunk ABOUT|MENTIONS StructuredNode)

You currently model relationship properties for ABOUT and MENTIONS as:

MentionsEdgeSchema fields

confidence, linkingMethod, surfaceForm

mongoRunId, mongoPlanId, stageKey, subStageKey, extractorVersion, extractedAt

plus TemporalValidity

AboutEdgeSchema fields

aboutness, aspect, stance

mongoRunId, mongoPlanId, stageKey, subStageKey, extractorVersion, extractedAt, confidence

plus TemporalValidity

So inputs must include those exact fields.

Node reference input
export const EvidenceSourceLabelEnum = z.enum(["Chunk", "Document"]);

export const NodeRefInputSchema = z.object({
  label: z.string(),
  id: z.string().optional(),              // preferred
  naturalKey: z.string().nullable().optional(), // fallback
});
export type NodeRefInput = z.infer<typeof NodeRefInputSchema>;

Mentions edge input (matches MentionsEdgeSchema relationship fields)
export const MentionsEdgeInputSchema = TemporalValidityInputSchema.extend({
  source: z.object({ label: EvidenceSourceLabelEnum, id: z.string() }), // usually Chunk
  target: NodeRefInputSchema,                                           // structured node

  confidence: z.number().nullable(),
  linkingMethod: z.string().nullable(),
  surfaceForm: z.string().nullable(),

  mongoRunId: z.string(),
  mongoPlanId: z.string().nullable(),
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
});
export type MentionsEdgeInput = z.infer<typeof MentionsEdgeInputSchema>;

About edge input (matches AboutEdgeSchema relationship fields)
export const AboutEdgeInputSchema = TemporalValidityInputSchema.extend({
  source: z.object({ label: EvidenceSourceLabelEnum, id: z.string() }), // usually Chunk
  target: NodeRefInputSchema,

  aboutness: z.number().nullable(),
  aspect: z.string().nullable(),
  stance: z.string().nullable(),

  mongoRunId: z.string(),
  mongoPlanId: z.string().nullable(),
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
  confidence: z.number().nullable(),
});
export type AboutEdgeInput = z.infer<typeof AboutEdgeInputSchema>;

Union wrapper
export const EvidenceEdgeInputSchema = z.union([
  z.object({ type: z.literal("MENTIONS"), edge: MentionsEdgeInputSchema }),
  z.object({ type: z.literal("ABOUT"), edge: AboutEdgeInputSchema }),
]);

export type EvidenceEdgeInput = z.infer<typeof EvidenceEdgeInputSchema>;

export const UpsertEvidenceEdgesInputSchema = z.object({
  edges: z.array(EvidenceEdgeInputSchema).min(1),
});
export type UpsertEvidenceEdgesInput = z.infer<typeof UpsertEvidenceEdgesInputSchema>;

How the function works

Writes connect-only edges between existing nodes.

source is usually a Chunk.id.

target is a structured node:

prefer target.id

allow fallback target.naturalKey lookup if you want.

The relationship properties written are exactly:

ABOUT: aboutness, aspect, stance, mongoRunId, mongoPlanId, stageKey, subStageKey, extractorVersion, extractedAt, confidence + temporal fields

MENTIONS: confidence, linkingMethod, surfaceForm, mongoRunId, mongoPlanId, stageKey, subStageKey, extractorVersion, extractedAt + temporal fields

Idempotency: relationship MERGE should be done using a deterministic key (typically sourceId + relType + targetId + mongoRunId + stageKey), so reruns don’t duplicate.

Summary: the exact flat primitive inputs you’ll implement

✅ upsertResearchPlanRef(input: UpsertResearchPlanRefInput)
✅ upsertResearchRunRef(input: UpsertResearchRunRefInput)
✅ linkResearchRunUsesPlan(input: LinkResearchRunUsesPlanInput)
✅ upsertDocument(input: UpsertDocumentInput) (optional generatedBy edge)
✅ upsertDocumentTextVersionBundle(input: UpsertDocumentTextVersionBundleInput) (nodes + structural edges + embeddings + optional ordering edges)
✅ upsertEvidenceEdges(input: UpsertEvidenceEdgesInput) (connect-only ABOUT/MENTIONS with full relationship provenance fields)

If you paste your existing TemporalValiditySchema (the actual Zod definition), I can align the input schemas to it 1:1 (including nullable/optional nuances) so there’s zero mismatch at runtime.