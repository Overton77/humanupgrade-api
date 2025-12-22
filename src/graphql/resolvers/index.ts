import { GraphQLScalarType, Kind } from "graphql";
import { Query } from "./Query.js";
import { Mutation } from "./Mutation.js";
import { Episode, EpisodeDoc } from "../../models/Episode.js";
import { Person, PersonDoc, IPerson } from "../../models/Person.js";
import {
  Business,
  BusinessDoc,
  IBusinessExecutive,
} from "../../models/Business.js";
import { Product, ProductDoc, IProduct } from "../../models/Product.js";
import { Compound, CompoundDoc, ICompound } from "../../models/Compound.js";
import { Protocol, ProtocolDoc, IProtocol } from "../../models/Protocol.js";
import { CaseStudy, CaseStudyDoc, ICaseStudy } from "../../models/CaseStudy.js";
import { UserDoc, IUser } from "../../models/User.js";
import { UserProfile, IUserProfile } from "../../models/UserProfile.js";
import { userSavedResolvers } from "./userSavedResolvers.js";
import { GraphQLContext } from "../context.js";
import { HydratedDocument } from "mongoose";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time scalar",
  serialize(value: any) {
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,

  Query,
  Mutation,

  User: {
    profile: async (parent: UserDoc, _args: unknown, ctx: GraphQLContext) =>
      await UserProfile.findOne({ userId: parent._id }),
  },

  Episode: {
    guests: async (parent: EpisodeDoc, _args: unknown, ctx: GraphQLContext) =>
      await ctx.loaders.entities.personById.loadMany(parent.guestIds ?? []),
    sponsorBusinesses: async (
      parent: EpisodeDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      await ctx.loaders.entities.businessById.loadMany(
        parent.sponsorBusinessIds ?? []
      ),
    protocols: async (
      parent: EpisodeDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      await ctx.loaders.entities.protocolById.loadMany(
        parent.protocolIds ?? []
      ),
  },

  Person: {
    businesses: async (
      parent: PersonDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      await ctx.loaders.entities.businessById.loadMany(
        parent.businessIds ?? []
      ),
    episodes: async (parent: PersonDoc, _args: unknown, ctx: GraphQLContext) =>
      await ctx.loaders.entities.episodeById.loadMany(parent.episodeIds ?? []),
  },

  Business: {
    products: async (
      parent: BusinessDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      await ctx.loaders.entities.productById.loadMany(parent.productIds ?? []),
    executives: async (
      parent: BusinessDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => {
      const ids = parent.executives?.map((e) => e.personId) ?? [];
      const people = await ctx.loaders.entities.personById.loadMany(ids);

      const docs = people.filter(
        (p): p is HydratedDocument<IPerson> => !(p instanceof Error) && !!p
      );

      return docs.map((person) => {
        const rel = parent.executives.find(
          (e) => e.personId.toString() === person._id.toString()
        );
        return {
          person,
          title: rel?.title,
          role: rel?.role,
        };
      });
    },
    owners: (parent: BusinessDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.personById.loadMany(parent.ownerIds ?? []),

    sponsoredEpisodes: (
      parent: BusinessDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) =>
      ctx.loaders.entities.episodeById.loadMany(parent.sponsorEpisodeIds ?? []),
  },

  Product: {
    business: async (parent: ProductDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.businessById.load(parent.businessId),
    compounds: async (
      parent: ProductDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => ctx.loaders.entities.compoundById.loadMany(parent.compoundIds ?? []),
  },

  Compound: {
    products: async (
      parent: CompoundDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => ctx.loaders.entities.productById.loadMany(parent.productIds ?? []),
    caseStudies: async (
      parent: CompoundDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => ctx.loaders.entities.caseStudiesByCompoundId.load(parent._id),
  },

  Protocol: {
    products: async (
      parent: ProtocolDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => ctx.loaders.entities.productById.loadMany(parent.productIds ?? []),
    compounds: async (
      parent: ProtocolDoc,
      _args: unknown,
      ctx: GraphQLContext
    ) => ctx.loaders.entities.compoundById.loadMany(parent.compoundIds ?? []),
  },

  CaseStudy: {
    episodes: (parent: CaseStudyDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.episodeById.loadMany(parent.episodeIds ?? []),

    compounds: (parent: CaseStudyDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.compoundById.loadMany(parent.compoundIds ?? []),

    products: (parent: CaseStudyDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.productById.loadMany(parent.productIds ?? []),

    protocols: (parent: CaseStudyDoc, _args: unknown, ctx: GraphQLContext) =>
      ctx.loaders.entities.protocolById.loadMany(parent.protocolIds ?? []),
  },

  UserSaved: {
    ...userSavedResolvers.UserSaved,
  },

  SavedTargetUnion: {
    ...userSavedResolvers.SavedTargetUnion,
  },
};
