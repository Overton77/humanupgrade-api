import {z} from "zod" 
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const ChunkInputSchema = z.object({
    chunkKey: z.string(), // unique idempotency: ${textVersionHash}:${segmentationHash}:${index}
    index: z.number().int(), // stable ordering within segmentation (0..N-1)
    text: z.string(),
  
    // Offsets (optional but recommended)
    charStart: z.number().int().nullable().optional(),
    charEnd: z.number().int().nullable().optional(),
  
    // Transcript alignment (optional)
    startMs: z.number().int().nullable().optional(),
    endMs: z.number().int().nullable().optional(),
  
    // Embeddings (Neo4j native)
    embedding: z.array(z.number()).nullable().optional(), // float[], optional but used today
    embeddingModel: z.string().nullable().optional(),
    embeddingVersion: z.string().nullable().optional(),
  
    // Temporal fields (required for upserts)
    validAt: Neo4jDateTimeString,
    expiredAt: Neo4jDateTimeString.optional(),
    invalidAt: Neo4jDateTimeString.optional(),
    createdAt: Neo4jDateTimeString,
    updatedAt: Neo4jDateTimeString,
  });
  
  export type ChunkInput = z.infer<typeof ChunkInputSchema>;