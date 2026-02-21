import type { Product } from "../types/ProductModel.js";
import { GraphQLContext } from "../context.js";

type ParentProduct = Partial<Product> & { productId: string };

export const ProductResolvers = {
  deliversLabTest: (
    parent: ParentProduct,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Product.productDeliversLabTestEdges.load(
      parent.productId
    ),

  implementsPanel: (
    parent: ParentProduct,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Product.productImplementsPanelEdges.load(
      parent.productId
    ),

  containsCompoundForm: (
    parent: ParentProduct,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Product.productContainsCompoundFormEdges.load(
      parent.productId
    ),

  followsPathway: (
    parent: ParentProduct,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Product.productFollowsPathwayEdges.load(
      parent.productId
    ),
};
