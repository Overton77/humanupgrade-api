import { GraphQLContext } from "../context.js";
import { UpsertDocumentInput } from "../inputs/DocumentInputs.js";
import { Document, UpsertDocumentTextVersionBundleResult } from "../types/DocumentModel.js";
import { upsertDocument, upsertDocumentTextVersionBundle } from "../../services/UnstructuredIngestion/DocumentWrite/documentWriteService.js";
import { UpsertDocumentTextVersionBundleInput } from "../inputs/DocumentTextVersionBundleInputs.js";
import { EvidenceEdgeInput, UpsertEvidenceEdgesInput } from "../inputs/EvidenceEdgeInputs.js";
import { upsertEvidenceEdge, upsertEvidenceEdges } from "../../services/UnstructuredIngestion/EvidenceWrite/evidenceWriteService.js"; 
import { UpsertEvidenceEdgeResult, UpsertEvidenceEdgeError, UpsertEvidenceEdgesResult } from "../types/EvidenceEdgeResultModels.js";

export const UnstructuredIngestionMutations = {
  upsertDocument: async (
    _parent: unknown,
    args: { input: UpsertDocumentInput },
    _ctx: GraphQLContext
  ): Promise<Document> => {
    const document = await upsertDocument(args.input);
    return document;
  }, 

  upsertDocumentTextVersionBundle: async( 
    _parent: unknown, 
    args: {input: UpsertDocumentTextVersionBundleInput}, 
    _ctx: GraphQLContext 
  ): Promise<UpsertDocumentTextVersionBundleResult> => {
    const result = await upsertDocumentTextVersionBundle(args.input);
    return result;
  }, 

  upsertEvidenceEdge: async( 
    _parent: unknown, 
    args: {input: EvidenceEdgeInput},  
    _ctx: GraphQLContext
  ): Promise<UpsertEvidenceEdgeResult | UpsertEvidenceEdgeError> => {
    const result = await upsertEvidenceEdge(args.input);
    return result;
  }, 

  upsertEvidenceEdges: async( 
    _parent: unknown, 
    args: {input: UpsertEvidenceEdgesInput}, 
    _ctx: GraphQLContext 
  ): Promise<UpsertEvidenceEdgesResult | UpsertEvidenceEdgeError> => {
    const result = await upsertEvidenceEdges(args.input);
    return result;
  },
  
};
