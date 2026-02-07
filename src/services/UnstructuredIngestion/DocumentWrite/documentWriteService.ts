import {
    executeWrite,
  } from "../../../db/neo4j/executor.js";
  import { firstRecordOrNull } from "../../../db/neo4j/utils.js";
  import { logger } from "../../../lib/logger.js";
  import { validateInput } from "../../../lib/validation.js";
  import {
    UpsertDocumentInput,
    UpsertDocumentInputSchema,
  } from "../../../graphql/inputs/DocumentInputs.js";
  import { Document, UpsertDocumentTextVersionBundleResult } from "../../../graphql/types/DocumentModel.js";
  import {
    buildDocumentUpsertCypher,
    createDocumentGeneratedByCypher,
    returnDocumentByDocumentKeyCypher,
  
    upsertDocumentTextVersionAndLinkCypher,
    upsertSegmentationAndLinkCypher,
    upsertChunksAndLinkCypher,
    createNextChunkEdgesForSegmentationCypher,
  } from "./statements/documentStatements.js"; 
  import { UpsertDocumentTextVersionBundleInputSchema, UpsertDocumentTextVersionBundleInput } from "../../../graphql/inputs/DocumentTextVersionBundleInputs.js";
  import { validateResearchRunRefExists } from "./utils/validateResearchRunRef.js";
  import { Errors } from "../../../lib/errors.js"; 
  import { edgeStampOrDefault } from "../utils/temporalFallback.js";
import { SearchSurfaceInput } from "../../../graphql/inputs/DocumentSearchSurfaceInputs.js";
import { TemporalStamp } from "./types.js";
  
  export async function upsertDocument(input: UpsertDocumentInput): Promise<Document> {
    const validated = validateInput(
      UpsertDocumentInputSchema,
      input,
      "UpsertDocumentInput"
    );
  
    // Validate ResearchRunRef exists if generatedBy is provided
    if (validated.generatedBy?.mongoRunId) {
      await validateResearchRunRefExists(validated.generatedBy.mongoRunId);
    } 

    const ss = validated.searchSurface; 
  
    const docParams = {
      documentKey: validated.documentKey,
      type: validated.type,
      title: validated.title ?? null,
      url: validated.url ?? null,
      publishedAt: validated.publishedAt ?? null,
      retrievedAt: validated.retrievedAt ?? null,
      validAt: validated.validAt ?? null,
      expiredAt: validated.expiredAt ?? null,
      invalidAt: validated.invalidAt ?? null,
      createdAt: validated.createdAt ?? null,
      updatedAt: validated.updatedAt ?? null, 
      searchText: ss?.searchText ?? null,
  searchTextEmbedding: ss?.searchTextEmbedding ?? null,
  searchTextModel: ss?.searchTextModel ?? null,
  searchTextVersion: ss?.searchTextVersion ?? null,
  searchTextUpdatedAt: ss?.searchTextUpdatedAt ?? null,
    };
  
    try {
      const document = await executeWrite(async (tx) => {
        // -------------------------------------------------------------------
        // 1) Upsert Document
        // -------------------------------------------------------------------
        const writeRes = await tx.run(buildDocumentUpsertCypher(), docParams);
        const upsertRecord = firstRecordOrNull(writeRes);
        if (!upsertRecord) throw new Error("upsertDocument: no record returned");
  
        const dNode = upsertRecord.get("d");
        const resolvedDocumentId =
          dNode?.properties?.documentId ?? dNode?.documentId;
  
        if (!resolvedDocumentId) {
          throw Errors.internalError("Write did not produce DocumentId.");
        }
  
        // -------------------------------------------------------------------
        // 2) GENERATED_BY edge (optional)
        // -------------------------------------------------------------------
        if (validated.generatedBy) {
          const g = validated.generatedBy;
          const generatedByParams = {
            documentId: resolvedDocumentId,
            mongoRunId: g.mongoRunId,
            operation: g.operation,
            stageKey: g.stageKey ?? null,
            subStageKey: g.subStageKey ?? null,
            extractorVersion: g.extractorVersion ?? null,
            extractedAt: g.extractedAt ?? null,
            validAt: g.validAt ?? validated.validAt ?? null,
            expiredAt: g.expiredAt ?? validated.expiredAt ?? null,
            invalidAt: g.invalidAt ?? validated.invalidAt ?? null,
            createdAt: g.createdAt ?? validated.createdAt ?? null,
            updatedAt: g.updatedAt ?? validated.updatedAt ?? null,
          };
  
          await tx.run(createDocumentGeneratedByCypher, generatedByParams);
        }
  
        // -------------------------------------------------------------------
        // 3) Inline chunk bundle (optional)
        //    Ensures: Document -> TextVersion -> Segmentation -> Chunk (+ optional Document->Chunk, NEXT_CHUNK)
        // -------------------------------------------------------------------
        if (validated.chunkBundle) {
          const b = validated.chunkBundle;

          // Defaults for edge stamps if not provided
          // Use document temporal fields (consistent + always present in this mutation)
          const defaultEdgeStamp: TemporalStamp = {
            validAt: validated.validAt!,
            expiredAt: validated.expiredAt ?? null,
            invalidAt: validated.invalidAt ?? null,
            createdAt: validated.createdAt!,
            updatedAt: validated.updatedAt!,
          };
  
          // You allowed optional textVersion/segmentation; for MVP, strongly recommend provided.
          // If missing, you can derive deterministically here (no LLM).
          if (!b.textVersion) {
            throw Errors.invalidInput(
              "chunkBundle.textVersion is required for inline chunk ingestion (MVP)."
            );
          }
          if (!b.segmentation) {
            throw Errors.invalidInput(
              "chunkBundle.segmentation is required for inline chunk ingestion (MVP)."
            );
          }
  
          const htv = edgeStampOrDefault(b.hasTextVersionEdge, defaultEdgeStamp);
          const hseg = edgeStampOrDefault(b.hasSegmentationEdge, defaultEdgeStamp);
          const segChunk = edgeStampOrDefault(b.segmentationHasChunkEdge, defaultEdgeStamp);
          const docChunk = edgeStampOrDefault(b.documentHasChunkEdge, defaultEdgeStamp);
          const next = edgeStampOrDefault(b.nextChunkEdge, defaultEdgeStamp);
  
          // 3a) Upsert TextVersion + link Document-[:HAS_TEXT_VERSION]->TextVersion 

          const tvSS = b.textVersion?.searchSurface; 
          const tvParams = {
            documentId: resolvedDocumentId,
  
            textVersionHash: b.textVersion.textVersionHash,
            source: b.textVersion.source,
            language: b.textVersion.language ?? null,
            text: b.textVersion.text,
  
            tv_validAt: b.textVersion.validAt,
            tv_expiredAt: b.textVersion.expiredAt ?? null,
            tv_invalidAt: b.textVersion.invalidAt ?? null,
            tv_createdAt: b.textVersion.createdAt,
            tv_updatedAt: b.textVersion.updatedAt, 
            tv_searchText: tvSS?.searchText ?? null,
            tv_searchTextEmbedding: tvSS?.searchTextEmbedding ?? null,
            tv_searchTextModel: tvSS?.searchTextModel ?? null,
            tv_searchTextVersion: tvSS?.searchTextVersion ?? null,
            tv_searchTextUpdatedAt: tvSS?.searchTextUpdatedAt ?? null,
  
            htv_validAt: htv.validAt,
            htv_expiredAt: htv.expiredAt,
            htv_invalidAt: htv.invalidAt,
            htv_createdAt: htv.createdAt,
            htv_updatedAt: htv.updatedAt,
          };
  
          const tvRes = await tx.run(upsertDocumentTextVersionAndLinkCypher, tvParams);
          const tvRecord = firstRecordOrNull(tvRes);
          if (!tvRecord) {
            throw Errors.internalError(
              `No documentTextVersionId returned. This should not happen as document was just created.`
            );
          }
          const documentTextVersionId = tvRecord.get("documentTextVersionId");
          if (!documentTextVersionId) {
            throw Errors.internalError("TextVersion write returned empty documentTextVersionId");
          }
  
          // 3b) Upsert Segmentation + link TextVersion-[:HAS_SEGMENTATION]->Segmentation
          const segParams = {
            documentTextVersionId,
  
            segmentationHash: b.segmentation.segmentationHash,
            strategy: b.segmentation.strategy,
            chunkSize: b.segmentation.chunkSize,
            overlap: b.segmentation.overlap,
  
            s_validAt: b.segmentation.validAt,
            s_expiredAt: b.segmentation.expiredAt ?? null,
            s_invalidAt: b.segmentation.invalidAt ?? null,
            s_createdAt: b.segmentation.createdAt,
            s_updatedAt: b.segmentation.updatedAt,
  
            hseg_validAt: hseg.validAt,
            hseg_expiredAt: hseg.expiredAt,
            hseg_invalidAt: hseg.invalidAt,
            hseg_createdAt: hseg.createdAt,
            hseg_updatedAt: hseg.updatedAt,
          };
  
          const segRes = await tx.run(upsertSegmentationAndLinkCypher, segParams);
          const segRecord = firstRecordOrNull(segRes);
          if (!segRecord) throw new Error("No segmentationId returned");
          const segmentationId = segRecord.get("segmentationId");
  
          // 3c) Upsert chunks + link Segmentation-[:HAS_CHUNK]->Chunk (+ optional Document-[:HAS_CHUNK]->Chunk)
          const chunksParams = {
            documentId: resolvedDocumentId,
            segmentationId,
            chunks: b.chunks,
  
            alsoCreateDocumentHasChunkEdges: b.alsoCreateDocumentHasChunkEdges ?? true,
  
            segChunk_validAt: segChunk.validAt,
            segChunk_expiredAt: segChunk.expiredAt,
            segChunk_invalidAt: segChunk.invalidAt,
            segChunk_createdAt: segChunk.createdAt,
            segChunk_updatedAt: segChunk.updatedAt,
  
            docChunk_validAt: docChunk.validAt,
            docChunk_expiredAt: docChunk.expiredAt,
            docChunk_invalidAt: docChunk.invalidAt,
            docChunk_createdAt: docChunk.createdAt,
            docChunk_updatedAt: docChunk.updatedAt,
          };
  
          await tx.run(upsertChunksAndLinkCypher, chunksParams);
  
          // 3d) NEXT_CHUNK edges (optional)
          if (b.alsoCreateNextChunkEdges ?? true) {
            const nextParams = {
              segmentationId,
              next_validAt: next.validAt,
              next_expiredAt: next.expiredAt,
              next_invalidAt: next.invalidAt,
              next_createdAt: next.createdAt,
              next_updatedAt: next.updatedAt,
            };
            await tx.run(createNextChunkEdgesForSegmentationCypher, nextParams);
          }
        }
  
        // -------------------------------------------------------------------
        // 4) Return Document (properties only in your current statement)
        // -------------------------------------------------------------------
        const finalRes = await tx.run(returnDocumentByDocumentKeyCypher, {
          documentKey: validated.documentKey,
        });
        const finalRecord = firstRecordOrNull(finalRes);
        if (!finalRecord) throw new Error("upsertDocument: not found after write");
  
        return finalRecord.get("document") as Document;
      });
  
      return document as Document;
    } catch (err: any) {
      logger.error("Neo4j write failed", {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
      });
      throw err;
    }
  }
  


function flattenSearchSurfaceParams(prefix: string, ss?: SearchSurfaceInput | null) {
    return {
      [`${prefix}_searchText`]: ss?.searchText ?? null,
      [`${prefix}_searchTextEmbedding`]: ss?.searchTextEmbedding ?? null,
      [`${prefix}_searchTextModel`]: ss?.searchTextModel ?? null,
      [`${prefix}_searchTextVersion`]: ss?.searchTextVersion ?? null,
      [`${prefix}_searchTextUpdatedAt`]: ss?.searchTextUpdatedAt ?? null,
    };
  } 



  export async function upsertDocumentTextVersionBundle(
    input: UpsertDocumentTextVersionBundleInput
  ): Promise<UpsertDocumentTextVersionBundleResult> {
    const validated = validateInput(
      UpsertDocumentTextVersionBundleInputSchema,
      input,
      "UpsertDocumentTextVersionBundleInput"
    );
  
    try {
      return await executeWrite(async (tx) => {
        const tv = validated.textVersion;
        const seg = validated.segmentation;
  
        // Choose one default source of temporal truth for edges:
        // Use textVersion temporal fields (consistent + always present in this mutation).
        const defaultEdgeStamp: TemporalStamp = {
          validAt: tv.validAt!,
          expiredAt: tv.expiredAt ?? null,
          invalidAt: tv.invalidAt ?? null,
          createdAt: tv.createdAt!,
          updatedAt: tv.updatedAt!,
        };
  
        const htv = edgeStampOrDefault(validated.hasTextVersionEdge, defaultEdgeStamp);
        const hseg = edgeStampOrDefault(validated.hasSegmentationEdge, defaultEdgeStamp);
        const segChunk = edgeStampOrDefault(validated.segmentationHasChunkEdge, defaultEdgeStamp);
        const docChunk = edgeStampOrDefault(validated.documentHasChunkEdge, defaultEdgeStamp);
        const next = edgeStampOrDefault(validated.nextChunkEdge, defaultEdgeStamp);
  
        // -------------------------------------------------------------------
        // 1) Upsert TextVersion + link Document-[:HAS_TEXT_VERSION]->TextVersion
        // -------------------------------------------------------------------
  
        const tvParams = {
          documentId: validated.documentId,
  
          textVersionHash: tv.textVersionHash,
          source: tv.source,
          language: tv.language ?? null,
          text: tv.text,
  
          tv_validAt: tv.validAt,
          tv_expiredAt: tv.expiredAt ?? null,
          tv_invalidAt: tv.invalidAt ?? null,
          tv_createdAt: tv.createdAt,
          tv_updatedAt: tv.updatedAt,
  
          ...flattenSearchSurfaceParams("tv", (tv as any).searchSurface ?? null),
  
          htv_validAt: htv.validAt,
          htv_expiredAt: htv.expiredAt,
          htv_invalidAt: htv.invalidAt,
          htv_createdAt: htv.createdAt,
          htv_updatedAt: htv.updatedAt,
        };
  
        const tvRes = await tx.run(upsertDocumentTextVersionAndLinkCypher, tvParams);
        const tvRecord = firstRecordOrNull(tvRes);
        if (!tvRecord) throw Errors.internalError("No documentTextVersionId returned");
  
        const documentTextVersionId = tvRecord.get("documentTextVersionId") as string;
        if (!documentTextVersionId)
          throw Errors.internalError("TextVersion write returned empty documentTextVersionId");
  
        // -------------------------------------------------------------------
        // 2) Upsert Segmentation + link TextVersion-[:HAS_SEGMENTATION]->Segmentation
        // -------------------------------------------------------------------
  
        const segParams = {
          documentTextVersionId,
  
          segmentationHash: seg.segmentationHash,
          strategy: seg.strategy,
          chunkSize: seg.chunkSize,
          overlap: seg.overlap,
  
          s_validAt: seg.validAt,
          s_expiredAt: seg.expiredAt ?? null,
          s_invalidAt: seg.invalidAt ?? null,
          s_createdAt: seg.createdAt,
          s_updatedAt: seg.updatedAt,
  
          hseg_validAt: hseg.validAt,
          hseg_expiredAt: hseg.expiredAt,
          hseg_invalidAt: hseg.invalidAt,
          hseg_createdAt: hseg.createdAt,
          hseg_updatedAt: hseg.updatedAt,
        };
  
        const segRes = await tx.run(upsertSegmentationAndLinkCypher, segParams);
        const segRecord = firstRecordOrNull(segRes);
        if (!segRecord) throw Errors.internalError("No segmentationId returned");
  
        const segmentationId = segRecord.get("segmentationId") as string;
        if (!segmentationId) throw Errors.internalError("Segmentation write returned empty segmentationId");
  
        // -------------------------------------------------------------------
        // 3) Upsert Chunks + link Segmentation-[:HAS_CHUNK]->Chunk
        //    Optionally also create Document-[:HAS_CHUNK]->Chunk edges
        // -------------------------------------------------------------------
  
        const chunksParams = {
          documentId: validated.documentId,
          segmentationId,
          chunks: validated.chunks,
  
          alsoCreateDocumentHasChunkEdges: validated.alsoCreateDocumentHasChunkEdges ?? true,
  
          segChunk_validAt: segChunk.validAt,
          segChunk_expiredAt: segChunk.expiredAt,
          segChunk_invalidAt: segChunk.invalidAt,
          segChunk_createdAt: segChunk.createdAt,
          segChunk_updatedAt: segChunk.updatedAt,
  
          docChunk_validAt: docChunk.validAt,
          docChunk_expiredAt: docChunk.expiredAt,
          docChunk_invalidAt: docChunk.invalidAt,
          docChunk_createdAt: docChunk.createdAt,
          docChunk_updatedAt: docChunk.updatedAt,
        };
  
        const chunksRes = await tx.run(upsertChunksAndLinkCypher, chunksParams);
        const chunksRecord = firstRecordOrNull(chunksRes);
        if (!chunksRecord) throw Errors.internalError("Chunks write returned no record");
  
        const chunkMetas =
          (chunksRecord.get("chunkMetas") as Array<{ chunkId: string; chunkKey: string; index: number }>) ?? [];
  
        // -------------------------------------------------------------------
        // 4) NEXT_CHUNK edges (optional)
        // -------------------------------------------------------------------
  
        let nextChunkEdgesCreated = false;
  
        if (validated.alsoCreateNextChunkEdges ?? true) {
          const nextParams = {
            segmentationId,
  
            next_validAt: next.validAt,
            next_expiredAt: next.expiredAt,
            next_invalidAt: next.invalidAt,
            next_createdAt: next.createdAt,
            next_updatedAt: next.updatedAt,
          };
  
          await tx.run(createNextChunkEdgesForSegmentationCypher, nextParams);
          nextChunkEdgesCreated = true;
        }
  
        return {
          documentId: validated.documentId,
          documentTextVersionId,
          segmentationId,
          chunkMetas,
          nextChunkEdgesCreated,
        } ;
      });
    } catch (err: any) {
      logger.error("Neo4j write failed (upsertDocumentTextVersionBundle)", {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
      });
      throw err;
    }
  }
  
  
  
  
  
  