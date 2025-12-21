import { GraphQLScalarType, Kind } from "graphql";
import { Query } from "./Query.js";
import { Mutation } from "./Mutation.js";
import { Episode, EpisodeDoc } from "../../models/Episode.js";
import { Person, PersonDoc } from "../../models/Person.js";
import {
  Business,
  BusinessDoc,
  IBusinessExecutive,
} from "../../models/Business.js";
import { Product, ProductDoc } from "../../models/Product.js";
import { Compound, CompoundDoc } from "../../models/Compound.js";
import { Protocol, ProtocolDoc } from "../../models/Protocol.js";
import { CaseStudy, CaseStudyDoc } from "../../models/CaseStudy.js";
import { UserDoc } from "../../models/User.js";
import { UserProfile } from "../../models/UserProfile.js";

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
    profile: async (parent: UserDoc) =>
      await UserProfile.findOne({ userId: parent._id }),
  },

  Episode: {
    guests: async (parent: EpisodeDoc) =>
      await Person.find({ _id: { $in: parent.guestIds || [] } }),
    sponsorBusinesses: async (parent: EpisodeDoc) =>
      await Business.find({ _id: { $in: parent.sponsorBusinessIds || [] } }),
    protocols: async (parent: EpisodeDoc) =>
      await Protocol.find({ _id: { $in: parent.protocolIds || [] } }),
  },

  Person: {
    businesses: async (parent: PersonDoc) =>
      await Business.find({ _id: { $in: parent.businessIds || [] } }),
    episodes: async (parent: PersonDoc) =>
      await Episode.find({ _id: { $in: parent.episodeIds || [] } }),
  },

  Business: {
    products: async (parent: BusinessDoc) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    executives: async (parent: BusinessDoc) => {
      const executives = await Person.find({
        _id: {
          $in:
            parent.executives.map((e: IBusinessExecutive) => e.personId) || [],
        },
      });
      return executives.map((e: PersonDoc) => ({
        person: e,
        title: parent.executives.find(
          (exec: IBusinessExecutive) =>
            exec.personId.toString() === e._id.toString()
        )?.title,
        role: parent.executives.find(
          (exec: IBusinessExecutive) =>
            exec.personId.toString() === e._id.toString()
        )?.role,
      }));
    },
    owners: async (parent: BusinessDoc) =>
      await Person.find({ _id: { $in: parent.ownerIds || [] } }),
    sponsoredEpisodes: async (parent: BusinessDoc) =>
      await Episode.find({ _id: { $in: parent.sponsorEpisodeIds || [] } }),
  },

  Product: {
    business: async (parent: ProductDoc) =>
      await Business.findById(parent.businessId),
    compounds: async (parent: ProductDoc) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },

  Compound: {
    products: async (parent: CompoundDoc) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    caseStudies: async (parent: CompoundDoc) =>
      await CaseStudy.find({ compoundIds: parent._id }),
  },

  Protocol: {
    products: async (parent: ProtocolDoc) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    compounds: async (parent: ProtocolDoc) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },

  CaseStudy: {
    episodes: async (parent: CaseStudyDoc) =>
      await Episode.find({ _id: { $in: parent.episodeIds || [] } }),
    compounds: async (parent: CaseStudyDoc) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },
};
