import { GraphQLScalarType, Kind } from "graphql";
import { Mutation } from "./Mutation.js";
import { Query } from "./Query.js";
import { OrganizationResolvers } from "./OrganizationResolvers.js";

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
  Mutation: {
    ...Mutation,
  },
  Query: {
    ...Query,
  },
  Organization: {
    ...OrganizationResolvers,
  },
};
