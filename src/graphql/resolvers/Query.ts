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
import { AppError, Errors } from "../../lib/errors.js";
import { userSavedResolvers } from "./userSavedResolvers.js";
import { requireSelfOrAdmin, requireUser } from "../../services/auth.js";
import { userProtocolResolvers } from "./userProtocolResolvers.js";
import { logActivity } from "../../services/activity/logActivity.js";
import {
  type ActivityEntityType,
  type ActivityEventType,
  type ActivityContextSurface,
} from "../../models/UserActivity.js";
import { getDashboard } from "../../services/dashboard/dashboardService.js";

export const Query = {
  ...userSavedResolvers.Query,
  ...userProtocolResolvers.Query,
  me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return null;

    return await ctx.loaders.userById.load(ctx.userId);
  },
  myProfile: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
    const user = await requireUser(ctx);

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

  product: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const product = await Product.findById(args.id);
    if (product && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "Product",
        entityId: product._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
    return product;
  },

  compounds: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Compound.find({}).skip(offset).limit(limit);
  },

  compound: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const compound = await Compound.findById(args.id);
    if (compound && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "Compound",
        entityId: compound._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
    return compound;
  },

  person: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const person = await Person.findById(args.id);
    if (person && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "Person",
        entityId: person._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
    return person;
  },

  business: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const business = await Business.findById(args.id);
    if (business && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "Business",
        entityId: business._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
    return business;
  },

  caseStudy: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const caseStudy = await CaseStudy.findById(args.id);
    if (caseStudy && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "CaseStudy",
        entityId: caseStudy._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
    return caseStudy;
  },
  protocols: async (
    _parent: unknown,
    args: { limit?: number; offset?: number }
  ) => {
    const { limit = 20, offset = 0 } = args;
    return await Protocol.find({}).skip(offset).limit(limit);
  },
  protocol: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const protocol = await Protocol.findById(args.id);
    if (protocol && ctx.userId) {
      await logActivity(ctx, {
        eventType: "VIEW_ENTITY",
        entityType: "Protocol",
        entityId: protocol._id as unknown as mongoose.Types.ObjectId,
        surface: "entity",
      });
    }
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
    args: { args: VectorSearchArgs },
    ctx: GraphQLContext
  ) => {
    const products = await vectorSearchProductsByDescription(args.args);

    await logActivity(ctx, {
      eventType: "SEARCH",
      entityType: "Product",
      entityId: undefined,
      surface: "search",
      metadata: {
        numCandidates: args.args.numCandidates,
        limit: args.args.limit,
        query: args.args.query,
        results: products,
      },
    });
    return products;
  },
  vectorSearchBusinesses: async (
    _parent: unknown,
    args: { args: VectorSearchArgs },
    ctx: GraphQLContext
  ) => {
    const errors: string[] = [];
    if (!args.args.query) errors.push("Query is required");
    if (args.args.numCandidates <= 0)
      errors.push("numCandidates must be greater than 0");
    if (args.args.limit <= 0) errors.push("limit must be greater than 0");
    if (errors.length > 0) {
      throw Errors.invalidInput(errors.join("; "));
    }

    const businesses = await vectorSearchBusinessesByDescription(args.args);

    await logActivity(ctx, {
      eventType: "SEARCH",
      entityType: "Business",
      entityId: undefined,
      surface: "search",
      metadata: {
        numCandidates: args.args.numCandidates,
        limit: args.args.limit,
        query: args.args.query,
        results: businesses,
      },
    });
    return businesses;
  },
  vectorSearchPeople: async (
    _parent: unknown,
    args: { args: VectorSearchArgs },
    ctx: GraphQLContext
  ) => {
    const people = await vectorSearchPeopleByBio(args.args);

    await logActivity(ctx, {
      eventType: "SEARCH",
      entityType: "Person",
      entityId: undefined,
      surface: "search",
      metadata: {
        numCandidates: args.args.numCandidates,
        limit: args.args.limit,
        query: args.args.query,
        results: people,
      },
    });
    return people;
  },
  dashboard: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) throw Errors.unauthenticated();

    requireSelfOrAdmin(ctx, ctx.userId!);

    const dashboard = await getDashboard(ctx.userId!);

    return dashboard;
  },
};
