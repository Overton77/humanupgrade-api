import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";

// ---------------------------
// SourceRef
// ---------------------------
export const EvidenceSourceRefSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Document"),
    documentId: z.string(),
  }),
  z.object({
    kind: z.literal("Chunk"),
    chunkId: z.string(),
  }),
]);

export type EvidenceSourceRef = z.infer<typeof EvidenceSourceRefSchema>;

// ---------------------------
// TargetRef
// ---------------------------
// Prefer nodeId; allow fallback lookup triple.
export const EvidenceTargetRefSchema = z.object({
  nodeId: z.string().nullable().optional(),

  // fallback resolution (only used if nodeId is missing)
  label: z.string().nullable().optional(),
  uniqueKey: z.string().nullable().optional(),
  uniqueKeyValue: z.string().nullable().optional(),
}).refine(
  (v) =>
    !!v.nodeId ||
    (!!v.label && !!v.uniqueKey && !!v.uniqueKeyValue),
  {
    message:
      "TargetRef must provide nodeId OR (label + uniqueKey + uniqueKeyValue).",
  }
);

export type EvidenceTargetRef = z.infer<typeof EvidenceTargetRefSchema>;
