import { Episode } from "../../models/Episode.js";
import { Product } from "../../models/Product.js";
import { Compound } from "../../models/Compound.js";
import { CaseStudy } from "../../models/CaseStudy.js";
import { User } from "../../models/User.js";
import { Person } from "../../models/Person.js";
import { Business } from "../../models/Business.js";
import { Protocol } from "../../models/Protocol.js";
import { vectorSearchProductsByDescription } from "../../services/searchService.js";
import { vectorSearchBusinessesByDescription } from "../../services/searchService.js";
import { vectorSearchPeopleByBio } from "../../services/searchService.js";
import { VectorSearchArgs } from "../inputs/vectorSearchInputs.js";
import mongoose from "mongoose";
import { getMe } from "../../services/userProfileService.js";
import { GraphQLContext } from "../context.js";
import { Errors } from "../../lib/errors.js";
import { userSavedResolvers } from "./userSavedResolvers.js";

export const Query = {
  ...userSavedResolvers.Query,
  me: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
    return ctx.userId ? ctx.loaders.userById.load(ctx.userId) : null;
  },
  myProfile: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
    const user = await ctx.loaders.userById.load(ctx.userId!);
    if (!user) {
      throw Errors.notFound("User not found");
    }
    return await getMe(user);
  },

  allUsers: async (
    _parent: unknown,
    args: { limit?: number; offset?: number },
    ctx: GraphQLContext
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await User.find({}).skip(offset).limit(limit);
  },

  episodes: async (
    _parent: unknown,
    args: { limit?: number; offset?: number },
    ctx: GraphQLContext
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Episode.find({}).skip(offset).limit(limit);
  },

  products: async (
    _parent: unknown,
    args: { limit?: number; offset?: number },
    ctx: GraphQLContext
  ) => {
    console.log(`[DB] Connected to MongoDB (db: ${mongoose.connection.name})`);
    const { limit = 20, offset = 0 } = args;
    return await Product.find({}).skip(offset).limit(limit);
  },

  product: async (_parent: unknown, args: { id: string }) => {
    return await Product.findById(args.id);
  },

  compounds: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Compound.find({}).skip(offset).limit(limit);
  },

  compound: async (_parent: unknown, args: { id: string }) => {
    return await Compound.findById(args.id);
  },

  person: async (_parent: unknown, args: { id: string }) => {
    return await Person.findById(args.id);
  },

  business: async (_parent: unknown, args: { id: string }) => {
    return await Business.findById(args.id);
  },

  caseStudy: async (_parent: unknown, args: { id: string }) => {
    return await CaseStudy.findById(args.id);
  },
  protocols: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Protocol.find({}).skip(offset).limit(limit);
  },
  protocol: async (_parent: unknown, args: { id: string }) => {
    const protocol = await Protocol.findById(args.id);
    return protocol ? protocol : null;
  },

  people: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Person.find({}).skip(offset).limit(limit);
  },

  businesses: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Business.find({}).skip(offset).limit(limit);
  },
  caseStudies: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await CaseStudy.find({}).skip(offset).limit(limit);
  },
  vectorSearchProducts: async (
    _parent: unknown,
    args: { args: VectorSearchArgs }
  ) => {
    return await vectorSearchProductsByDescription(args.args);
  },
  vectorSearchBusinesses: async (
    _parent: unknown,
    args: { args: VectorSearchArgs }
  ) => {
    return await vectorSearchBusinessesByDescription(args.args);
  },
  vectorSearchPeople: async (
    _parent: unknown,
    args: { args: VectorSearchArgs }
  ) => {
    return await vectorSearchPeopleByBio(args.args);
  },
};
