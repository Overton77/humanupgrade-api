import { GraphQLScalarType, Kind } from "graphql";
import { Query } from "./Query";
import { Mutation } from "./Mutation";
import { Episode, IEpisode } from "../../models/Episode";
import { Person, IPerson } from "../../models/Person";
import { Business, IBusiness } from "../../models/Business";
import { Product, IProduct } from "../../models/Product";
import { Compound, ICompound } from "../../models/Compound";
import { CaseStudy, ICaseStudy } from "../../models/CaseStudy";
import { IUser } from "../../models/User";

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
    sponsorProducts: async (parent: IEpisode) =>
      await Product.find({ _id: { $in: parent.sponsorProductIds || [] } }),
  },

  Person: {
    businesses: async (parent: IPerson) =>
      await Business.find({ _id: { $in: parent.businessIds || [] } }),
  },

  Business: {
    products: async (parent: IBusiness) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
  },

  Product: {
    business: async (parent: IProduct) =>
      await Business.findById(parent.businessId),
    sponsorEpisodes: async (parent: IProduct) =>
      await Episode.find({ _id: { $in: parent.sponsorEpisodes || [] } }),
    compounds: async (parent: IProduct) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },

  Compound: {
    products: async (parent: ICompound) =>
      await Product.find({ _id: { $in: parent.productIds || [] } }),
    caseStudies: async (parent: ICompound) =>
      await CaseStudy.find({ compoundIds: parent._id }),
  },

  CaseStudy: {
    episodes: async (parent: ICaseStudy) =>
      await Episode.find({ _id: { $in: parent.episodeIds || [] } }),
    compounds: async (parent: ICaseStudy) =>
      await Compound.find({ _id: { $in: parent.compoundIds || [] } }),
  },
};
