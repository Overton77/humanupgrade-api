import { Episode } from "../../models/Episode";
import { Product } from "../../models/Product";
import { Compound } from "../../models/Compound";

export const Query = {
  me: (_parent: unknown, _args: unknown, ctx: any) => {
    return ctx.user || null;
  },

  episodes: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Episode.find({}).skip(offset).limit(limit);
  },

  episode: async (_parent: unknown, args: { id: string }) => {
    return Episode.findById(args.id).exec();
  },

  products: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return Product.find().skip(offset).limit(limit).exec();
  },

  product: async (_parent: unknown, args: { id: string }) => {
    return Product.findById(args.id).exec();
  },

  compounds: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return Compound.find().skip(offset).limit(limit).exec();
  },

  compound: async (_parent: unknown, args: { id: string }) => {
    return Compound.findById(args.id).exec();
  },
};
