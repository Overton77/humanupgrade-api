// src/graphql/resolvers/subscriptions.ts

import { RedisAsyncIterator } from "../subscriptions/redisAsyncIterator.js";
import { 
  chDocumentIngested, 
  chDocumentTextVersionBundleIngested, 
  chEmbeddingJobEvents, 
  chEvidenceEdgeUpserted,
  CH_PATTERN_DOCUMENT_INGESTED,
  CH_PATTERN_DOCUMENT_TEXT_VERSION_BUNDLE_INGESTED,
  CH_PATTERN_EVIDENCE_EDGE_UPSERTED
} from "../../lib/redisPubSub.js";
import type { EmbeddingTargetType } from "../enums/index.js";
import type { EmbeddingJobEvent } from "../types/EmbeddingModel.js";
import { UpsertEvidenceEdgeResult } from "../types/EvidenceEdgeResultModels.js";
import { UpsertDocumentTextVersionBundleResult } from "../types/DocumentModel.js";
import type { Document } from "../types/DocumentModel.js";

export const Subscriptions = {
  embeddingJobEvents: {
    subscribe: (
      _: unknown,
      args: { targetType: EmbeddingTargetType; targetID?: string | null }
    ) => {
      const { targetType, targetID: targetId } = args;

      const channels = targetId
        ? [
            chEmbeddingJobEvents(targetType, targetId),
            chEmbeddingJobEvents(targetType), // optional: include type-wide
          ]
        : [chEmbeddingJobEvents(targetType)];

      return new RedisAsyncIterator(channels);
    },
    resolve: (payload: EmbeddingJobEvent): EmbeddingJobEvent => payload,
  },
  documentIngested: {
    subscribe: (
      _: unknown,
      args: { documentId?: string | null }
    ) => {
      // If documentId is provided, subscribe to specific channel
      // Otherwise, subscribe to all document ingestion events using pattern
      if (args.documentId) {
        return new RedisAsyncIterator([chDocumentIngested(args.documentId)]);
      }
      return new RedisAsyncIterator([], [CH_PATTERN_DOCUMENT_INGESTED]);
    },
    resolve: (payload: Document): Document => payload,
  }, 
  documentTextVersionBundleIngested: {
    subscribe: (
      _: unknown,
      args: { documentTextVersionId?: string | null }
    ) => {
      // If documentTextVersionId is provided, subscribe to specific channel
      // Otherwise, subscribe to all document text version bundle ingestion events using pattern
      if (args.documentTextVersionId) {
        return new RedisAsyncIterator([chDocumentTextVersionBundleIngested(args.documentTextVersionId)]);
      }
      return new RedisAsyncIterator([], [CH_PATTERN_DOCUMENT_TEXT_VERSION_BUNDLE_INGESTED]);
    },
    resolve: (payload: UpsertDocumentTextVersionBundleResult): UpsertDocumentTextVersionBundleResult => payload,
  },   
  evidenceEdgeUpserted: {
    subscribe: (
      _: unknown,
      args: { relKey?: string | null }
    ) => {
      // If relKey is provided, subscribe to specific channel
      // Otherwise, subscribe to all evidence edge upsert events using pattern
      if (args.relKey) {
        return new RedisAsyncIterator([chEvidenceEdgeUpserted(args.relKey)]);
      }
      return new RedisAsyncIterator([], [CH_PATTERN_EVIDENCE_EDGE_UPSERTED]);
    },
    resolve: (payload: UpsertEvidenceEdgeResult): UpsertEvidenceEdgeResult => payload,
  },   
};
