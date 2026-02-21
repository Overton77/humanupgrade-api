import { GraphQLContext } from "../context.js";
import { UpsertDocumentInput } from "../inputs/DocumentInputs.js";
import { Document, UpsertDocumentTextVersionBundleResult } from "../types/DocumentModel.js";
import { upsertDocument, upsertDocumentTextVersionBundle } from "../../services/UnstructuredIngestion/DocumentWrite/documentWriteService.js";
import { UpsertDocumentTextVersionBundleInput } from "../inputs/DocumentTextVersionBundleInputs.js";
import {
  EvidenceEdgeInput,
  UpsertEvidenceEdgesInput,
  GraphQLEvidenceEdgeInput,
  GraphQLUpsertEvidenceEdgesInput,
  transformGraphQLEvidenceEdgeInput,
} from "../inputs/EvidenceEdgeInputs.js";
import { upsertEvidenceEdge, upsertEvidenceEdges } from "../../services/UnstructuredIngestion/EvidenceWrite/evidenceWriteService.js"; 
import { UpsertEvidenceEdgeResult, UpsertEvidenceEdgeError, UpsertEvidenceEdgesResult } from "../types/EvidenceEdgeResultModels.js"; 
import { chDocumentTextVersionBundleIngested, chDocumentIngested, chEvidenceEdgeUpserted, publishJson } from "../../lib/redisPubSub.js"; 

export const UnstructuredIngestionMutations = {
  upsertDocument: async (
    _parent: unknown,
    args: { input: UpsertDocumentInput },
    _ctx: GraphQLContext
  ): Promise<Document> => {
    const document = await upsertDocument(args.input); 

    if (document) { 
      await publishJson(chDocumentIngested(document.documentId), document)
    }
    return document;
  }, 

  upsertDocumentTextVersionBundle: async( 
    _parent: unknown, 
    args: {input: UpsertDocumentTextVersionBundleInput}, 
    _ctx: GraphQLContext 
  ): Promise<UpsertDocumentTextVersionBundleResult> => {
    const result = await upsertDocumentTextVersionBundle(args.input);  

    if (result) { 
      await publishJson(chDocumentTextVersionBundleIngested(result.documentTextVersionId), result)
    }

    
    return result;
  }, 

  upsertEvidenceEdge: async( 
    _parent: unknown, 
    args: {input: GraphQLEvidenceEdgeInput},  
    _ctx: GraphQLContext
  ): Promise<UpsertEvidenceEdgeResult | UpsertEvidenceEdgeError> => {
    // Transform flattened GraphQL input to nested service input structure
    const transformedInput: EvidenceEdgeInput = transformGraphQLEvidenceEdgeInput(args.input);
    const result = await upsertEvidenceEdge(transformedInput); 

    if (result && result.ok) { 
      await publishJson(chEvidenceEdgeUpserted(result.relKey), result)
    }
    return result;
  }, 

  upsertEvidenceEdges: async ( 
    _parent: unknown, 
    args: { input: GraphQLUpsertEvidenceEdgesInput[] }, 
    _ctx: GraphQLContext 
  ): Promise<UpsertEvidenceEdgesResult[]> => {
    // GraphQL mutation takes array of UpsertEvidenceEdgesInput
    // Combine all edges from all inputs into a single batch
    const allTransformedEdges: EvidenceEdgeInput[] = [];
    
    for (const inputItem of args.input) {
      const transformedEdges = inputItem.edges.map(
        (edge) => transformGraphQLEvidenceEdgeInput(edge)
      );
      allTransformedEdges.push(...transformedEdges);
    }

    // Process all edges in a single batch
    const serviceInput: UpsertEvidenceEdgesInput = {
      edges: allTransformedEdges,
    };
    
    const result = await upsertEvidenceEdges(serviceInput);

    // Publish notifications for successful edges
    const publicationPromises = result.results
      .filter(r => r && r.ok)
      .map(r => publishJson(chEvidenceEdgeUpserted(r.relKey), r));

    await Promise.all(publicationPromises); 
    
    // Return as array to match GraphQL mutation signature
    return [result];
  },
};
