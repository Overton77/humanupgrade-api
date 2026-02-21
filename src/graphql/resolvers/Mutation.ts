import {
  OrganizationInput,
  UpdateOrganizationInput,
} from "../inputs/OrganizationInputs.js";
import {
  createOrganizationWithOptionalRelations,
  updateOrganizationWithOptionalRelations,
} from "../../services/Organization/organizationService.js"; 
import { createProductWithOptionalRelations, updateProductWithOptionalRelations } from "../../services/Product/productService.js";
import { GraphQLContext } from "../context.js";
import { ProductInput, UpdateProductInput } from "../inputs/ProductInputs.js";
import { Organization } from "../types/OrganizationModel.js"; 
import { Product } from "../types/ProductModel.js";  
import { 
  
  LabTestInputWithRelations,
  UpdateLabTestInputWithRelations 
} from "../inputs/LabTestInputs.js";
import { LabTest } from "../types/LabTestModel.js";
import { 
  
  PanelDefinitionInputWithRelations,
  UpdatePanelDefinitionInputWithRelations 
} from "../inputs/PanelDefinitionInputs.js";
import { PanelDefinition } from "../types/PanelDefinitionModel.js";
import { BiomarkerInput, BiomarkerUpdateInput } from "../inputs/BiomarkerInputs.js";
import { Biomarker } from "../types/BiomarkerModel.js";
import { createLabTestWithOptionalRelations, updateLabTestWithOptionalRelations } from "../../services/LabTest/labTestService.js";
import { createPanelDefinitionWithOptionalRelations, updatePanelDefinitionWithOptionalRelations } from "../../services/PanelDefinition/panelDefinitionService.js";
import { createBiomarker, updateBiomarker } from "../../services/Biomarker/biomarkerService.js";
import { EmbeddingMutations } from "./embeddingMutations.js";
import { UnstructuredIngestionMutations } from "./UnstructuredIngestionResolvers.js";
import { ProvenanceMutations } from "./ProvenanceResolvers.js";  
import { UpsertCaseStudyInput } from "../inputs/CaseStudyInputs.js";
import { upsertCaseStudy } from "../../services/Study/studyService.js";
import { Study } from "../types/StudyModel.js";


// TODO: Make naming consistent. Model got confused by function names like create<>WithRelations


export const Mutation = {
  createOrganization: async (
    _parent: any,
    args: { input: OrganizationInput },
    ctx: GraphQLContext
  ): Promise<Organization> => {
    const organization = await createOrganizationWithOptionalRelations(
      args.input
    );
    return organization;
  },
  updateOrganization: async (
    _parent: any,
    args: { input: UpdateOrganizationInput },
    _ctx: GraphQLContext
  ): Promise<Organization> => {
    const organization = await updateOrganizationWithOptionalRelations(
      args.input
    );
    return organization;
  },  

  createProduct: async ( 
    _parent: unknown, 
    args: {input: ProductInput}, 
    ctx: GraphQLContext 
  ): Promise<Product> => { 
    const product = await createProductWithOptionalRelations(args.input); 

    return product; 
  }, 
  
  updateProduct: async ( 
    _parent: unknown, 
    args: {input: UpdateProductInput}, 
    ctx: GraphQLContext 
  ): Promise<Product> => { 
    const product = await updateProductWithOptionalRelations( 
      args.input 
    ) 

    return product; 
  },

  createLabTest: async (
    _parent: unknown,
    args: { input: LabTestInputWithRelations },
    ctx: GraphQLContext
  ): Promise<LabTest> => {
    // GraphQL input is compatible with WithRelations type (extends base)
    const labTest = await createLabTestWithOptionalRelations(args.input);
    return labTest;
  },

  updateLabTest: async (
    _parent: unknown,
    args: { input: UpdateLabTestInputWithRelations },
    ctx: GraphQLContext
  ): Promise<LabTest> => {
   
    const labTest = await updateLabTestWithOptionalRelations(args.input);
    return labTest;
  },

  createPanelDefinition: async (
    _parent: unknown,
    args: { input: PanelDefinitionInputWithRelations },
    ctx: GraphQLContext
  ): Promise<PanelDefinition> => {
   
    const panelDefinition = await createPanelDefinitionWithOptionalRelations(args.input);
    return panelDefinition;
  },

  updatePanelDefinition: async (
    _parent: unknown,
    args: { input: UpdatePanelDefinitionInputWithRelations },
    ctx: GraphQLContext
  ): Promise<PanelDefinition> => {
    
    const panelDefinition = await updatePanelDefinitionWithOptionalRelations(args.input);
    return panelDefinition;
  },

  createBiomarker: async (
    _parent: unknown,
    args: { input: BiomarkerInput },
    ctx: GraphQLContext
  ): Promise<Biomarker> => {
    const biomarker = await createBiomarker(args.input);
    return biomarker;
  },

  updateBiomarker: async (
    _parent: unknown,
    args: { input: BiomarkerUpdateInput },
    ctx: GraphQLContext
  ): Promise<Biomarker> => {
    const biomarker = await updateBiomarker(args.input);
    return biomarker;
  }, 
  upsertCaseStudy: async(  
    _parent: unknown, 
    args: {input: UpsertCaseStudyInput}, 
    ctx: GraphQLContext 
    
  ): Promise<Study> => { 
    const caseStudyResult  = await upsertCaseStudy(args.input) 
    return caseStudyResult;  
  }, 

  ...EmbeddingMutations,
  ...UnstructuredIngestionMutations,
  ...ProvenanceMutations,
};
