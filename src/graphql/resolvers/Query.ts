import { findAllOrganizations } from "../../services/Organization/organizationService.js";
import { findAllProducts } from "../../services/Product/productService.js"; 
import { GraphQLContext } from "../context.js"; 
import { Organization } from "../types/OrganizationModel.js";
import { Product } from "../types/ProductModel.js"; 
import { searchOrganizations } from "../../services/Search/Organization/searchOrganization.js"; 
import { createOpenAIEmbedder } from "../../embeddings/openaiEmbedder.js";
import { OrganizationSearchInput } from "../inputs/SearchInputs.js";
import { OrganizationSearchResult } from "../types/SearchModel.js";

export const Query = {
  organizations: async (_parent: unknown, _args: unknown, _ctx: GraphQLContext): Promise<Organization[]> => {
    const organizations = await findAllOrganizations();
    return organizations;
  },
  products: async (_parent: unknown, _args: unknown, _ctx: GraphQLContext): Promise<Product[]> => {
    const products = await findAllProducts();
    return products;
  },  

  searchOrganizations: async (_parent: unknown, args: { input: OrganizationSearchInput }, _ctx: GraphQLContext): Promise<OrganizationSearchResult> => { 

    const embedder = createOpenAIEmbedder();

    const result = await searchOrganizations(args.input, { embedder });
    return result;
  }
  
};
