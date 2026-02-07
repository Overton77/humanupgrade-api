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
import { EmbeddingMutations } from "./embeddingMutations.js";
import { UnstructuredIngestionMutations } from "./UnstructuredIngestionResolvers.js";
import { ProvenanceMutations } from "./ProvenanceResolvers.js";


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
  ...EmbeddingMutations,
  ...UnstructuredIngestionMutations,
  ...ProvenanceMutations,
};
