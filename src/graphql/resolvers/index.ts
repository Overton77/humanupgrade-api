import { GraphQLScalarType, Kind } from "graphql";
import { Query } from "./Query.js";
import { Mutation } from "./Mutation.js";
import { Episode, IEpisode } from "../../models/Episode.js";
import { Person, IPerson } from "../../models/Person.js";
import {
  Business,
  IBusiness,
  IBusinessExecutive,
} from "../../models/Business.js";
import { Product, IProduct } from "../../models/Product.js";
import { Compound, ICompound } from "../../models/Compound.js";
import { Protocol, IProtocol } from "../../models/Protocol.js";
import { CaseStudy, ICaseStudy } from "../../models/CaseStudy.js";
import { IUser } from "../../models/User.js";
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
    profile: async (parent: IUser) =>
      await UserProfile.findOne({ userId: parent._id }),
    savedEpisodes: async (parent: IUser) =>
      await Episode.find({ _id: { $in: parent.savedEpisodes } }),
    savedProducts: async (parent: IUser) =>
      await Product.find({ _id: { $in: parent.savedProducts } }),
    savedBusinesses: async (parent: IUser) =>
      await Business.find({ _id: { $in: parent.savedBusinesses } }),
  },

  Episode: {
    guests: async (parent: IEpisode) =>
      await Person.find({ _id: { $in: parent.guestIds || [] } }),
    sponsorBusinesses: async (parent: IEpisode) =>
      await Business.find({ _id: { $in: parent.sponsorBusinessIds || [] } }),
    protocols: async (parent: IEpisode) =>
      await Protocol.find({ _id: { $in: parent.protocolIds || [] } }),
  },

  Person: {
    businesses: async (parent: IPerson) =>
      await Business.find({ _id: { $in: parent.businessIds || [] } }),
    episodes: async (parent: IPerson) =>
      await Episode.find({ _id: { $in: parent.episodeIds || [] } }),
  },

  Business: {
    products: async (parent: IBusiness) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    executives: async (parent: IBusiness) => {
      const executives = await Person.find({
        _id: {
          $in:
            parent.executives.map((e: IBusinessExecutive) => e.personId) || [],
        },
      });
      return executives.map((e: IPerson) => ({
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
    owners: async (parent: IBusiness) =>
      await Person.find({ _id: { $in: parent.ownerIds || [] } }),
    sponsoredEpisodes: async (parent: IBusiness) =>
      await Episode.find({ _id: { $in: parent.sponsorEpisodeIds || [] } }),
  },

  Product: {
    business: async (parent: IProduct) =>
      await Business.findById(parent.businessId),
    compounds: async (parent: IProduct) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },

  Compound: {
    products: async (parent: ICompound) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    caseStudies: async (parent: ICompound) =>
      await CaseStudy.find({ compoundIds: parent._id }),
  },

  Protocol: {
    products: async (parent: IProtocol) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    compounds: async (parent: IProtocol) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },

  CaseStudy: {
    episodes: async (parent: ICaseStudy) =>
      await Episode.find({ _id: { $in: parent.episodeIds || [] } }),
    compounds: async (parent: ICaseStudy) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },
};
