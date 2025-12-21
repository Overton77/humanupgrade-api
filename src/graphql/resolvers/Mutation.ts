import bcrypt from "bcrypt";
import { User } from "../../models/User.js";
import { signAuthToken } from "../../services/auth.js";
import { GraphQLContext } from "../../graphql/context.js";
import {
  createBusinessWithRelations,
  updateBusinessWithOptionalIds,
  updateBusinessWithRelationFields,
  deleteBusiness,
} from "../../services/businessService.js";
import {
  BusinessCreateRelationsInput,
  BusinessUpdateWithOptionalIdsInput,
  BusinessUpdateRelationFieldsInput,
} from "../inputs/businessInputs.js";
import {
  createProductWithOptionalIds,
  deleteProduct,
  updateProductWithOptionalIds,
  updateProductWithRelationFields,
} from "../../services/productService.js";
import {
  ProductCreateWithOptionalIdsInput,
  ProductUpdateWithOptionalIdsInput,
  ProductUpdateRelationFieldsInput,
} from "../inputs/productInputs.js";
import {
  createPerson,
  updatePerson,
  deletePerson,
} from "../../services/personService.js";
import {
  PersonScalarFields,
  PersonScalarUpdateFields,
} from "../inputs/personInputs.js";
import {
  createEpisodeWithOptionalIds,
  updateEpisodeWithOptionalIds,
  updateEpisodeWithRelationFields,
  deleteEpisodeByPageUrlOrId,
  deleteAllEpisodes,
} from "../../services/episodeService.js";
import {
  EpisodeCreateWithOptionalIdsInput,
  EpisodeUpdateWithOptionalIdsInput,
  EpisodeUpdateRelationFieldsInput,
} from "../inputs/episodeInputs.js";
import {
  createCompoundWithOptionalIds,
  deleteCompound,
  updateCompoundWithOptionalIds,
  updateCompoundWithRelationFields,
} from "../../services/compoundService.js";
import {
  CompoundCreateWithOptionalIdsInput,
  CompoundUpdateWithOptionalIdsInput,
  CompoundUpdateRelationFieldsInput,
} from "../inputs/compoundInputs.js";

import {
  createCaseStudyWithOptionalIds,
  updateCaseStudyWithOptionalIds,
} from "../../services/caseStudyService.js";
import {
  CaseStudyCreateWithOptionalIdsInput,
  CaseStudyUpdateWithOptionalIdsInput,
} from "../inputs/caseStudyInputs.js";

import { requireAuth, requireAdmin } from "../../services/auth.js";
import { upsertUser, deleteUser } from "../../services/userService.js";
import { UserUpsertInput } from "../inputs/userInputs.js";

import {
  createProtocolWithOptionalIds,
  updateProtocolWithOptionalIds,
  updateProtocolWithRelationFields,
} from "../../services/protocolService.js";
import {
  ProtocolCreateWithOptionalIdsInput,
  ProtocolUpdateWithOptionalIdsInput,
  ProtocolUpdateRelationFieldsInput,
} from "../inputs/protocolInputs.js";

import {
  embedProductDescription,
  embedBusinessDescription,
  embedPersonBio,
} from "../../services/createEmbeddingsService.js";
import { Product } from "../../models/Product.js";
import { Business } from "../../models/Business.js";
import { Person } from "../../models/Person.js";
import { UserProfileUpsertInput } from "../inputs/userProfileInputs.js";
import {
  deleteUserProfile,
  upsertUserProfile,
} from "../../services/userProfileService.js";
import { Errors } from "../../lib/errors.js";

const SALT_ROUNDS = 10;

export const Mutation = {
  register: async (
    _parent: unknown,
    args: {
      email: string;
      password: string;
      name?: string;
      role?: "admin" | "user";
    },
    ctx: GraphQLContext
  ) => {
    const existing = await User.findOne({ email: args.email });
    if (existing) {
      throw new Error("Email already in use");
    }

    const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS);

    const user = await User.create({
      email: args.email,
      passwordHash,
      provider: "local",
      name: args.name,
      role: args.role || "user",
    });

    const token = signAuthToken({
      userId: user._id.toString(),
      role: user.role || "user",
    });

    return { token, user };
  },

  upsertUser: async (
    _p: unknown,
    args: { input: UserUpsertInput },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return upsertUser(args.input);
  },

  deleteUser: async (
    _p: unknown,
    args: { userId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);

    const user = await ctx.loaders.userById.load(ctx.userId!);
    if (!user) {
      throw Errors.internalError("Failed to load user");
    }

    const deleteResult = await deleteUser(user._id);

    return deleteResult;
  },

  upsertUserProfile: async (
    _p: unknown,
    args: { input: UserProfileUpsertInput },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    return await upsertUserProfile(args.input);
  },

  deleteUserProfile: async (
    _p: unknown,
    args: { userId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);

    const user = await ctx.loaders.userById.load(ctx.userId!);

    if (!user) {
      throw new Error("User not found");
    }

    return await deleteUserProfile(user._id.toString());
  },
  login: async (
    _parent: unknown,
    args: { email: string; password: string }
  ) => {
    const user = await User.findOne({ email: args.email });
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const valid = await user.comparePassword(args.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      role: user.role || "user",
    });
    return { token, user };
  },

  createBusinessWithRelations: async (
    _parent: unknown,
    args: { input: BusinessCreateRelationsInput },
    ctx: GraphQLContext
  ) => {
    // args.input shape matches BusinessCreateWithOptionalIdsInput
    const business = await createBusinessWithRelations(args.input);
    return business;
  },

  updateBusiness: async (
    _parent: unknown,
    args: { input: BusinessUpdateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const business = await updateBusinessWithOptionalIds(args.input);
    return business;
  },

  updateBusinessRelations: async (
    _parent: unknown,
    args: { input: BusinessUpdateRelationFieldsInput },
    ctx: GraphQLContext
  ) => {
    const business = await updateBusinessWithRelationFields(args.input);
    return business;
  },

  // --- Product mutations ---

  createProduct: async (
    _parent: unknown,
    args: { input: ProductCreateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const product = await createProductWithOptionalIds(args.input);
    return product;
  },

  updateProduct: async (
    _parent: unknown,
    args: { input: ProductUpdateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const product = await updateProductWithOptionalIds(args.input);
    return product;
  },

  updateProductRelations: async (
    _parent: unknown,
    args: { input: ProductUpdateRelationFieldsInput },
    ctx: GraphQLContext
  ) => {
    const product = await updateProductWithRelationFields(args.input);
    return product;
  },

  deleteProduct: async (
    _parent: unknown,
    args: { id: string },
    _ctx: GraphQLContext
  ) => {
    const product = await deleteProduct(args.id);
    return product;
  },

  // --- Person mutations ---

  createPerson: async (
    _parent: unknown,
    args: { input: PersonScalarFields },
    ctx: GraphQLContext
  ) => {
    const person = await createPerson(args.input);
    return person;
  },

  updatePerson: async (
    _parent: unknown,
    args: { input: PersonScalarUpdateFields },
    ctx: GraphQLContext
  ) => {
    const person = await updatePerson(args.input);
    return person;
  },

  deletePerson: async (_parent: unknown, args: { id: string }, _ctx: any) => {
    const person = await deletePerson(args.id);
    return person;
  },

  // --- Episode mutations ---

  createEpisode: async (
    _parent: unknown,
    args: { input: EpisodeCreateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const episode = await createEpisodeWithOptionalIds(args.input);
    return episode;
  },

  updateEpisode: async (
    _parent: unknown,
    args: { input: EpisodeUpdateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const episode = await updateEpisodeWithOptionalIds(args.input);
    return episode;
  },

  updateEpisodeRelations: async (
    _parent: unknown,
    args: { input: EpisodeUpdateRelationFieldsInput },
    ctx: GraphQLContext
  ) => {
    const episode = await updateEpisodeWithRelationFields(args.input);
    return episode;
  },

  deleteEpisode: async (
    _parent: unknown,
    args: { identifier: string },
    ctx: GraphQLContext
  ) => {
    const episode = await deleteEpisodeByPageUrlOrId(args.identifier);
    if (!episode) {
      throw new Error(`Episode not found with identifier: ${args.identifier}`);
    }
    return episode;
  },

  deleteAllEpisodes: async (
    _parent: unknown,
    _args: unknown,
    ctx: GraphQLContext
  ) => {
    const result = await deleteAllEpisodes();
    return result;
  },

  // --- Compound mutations ---

  createCompound: async (
    _parent: unknown,
    args: { input: CompoundCreateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const compound = await createCompoundWithOptionalIds(args.input);
    return compound;
  },

  updateCompound: async (
    _parent: unknown,
    args: { input: CompoundUpdateWithOptionalIdsInput },
    ctx: GraphQLContext
  ) => {
    const compound = await updateCompoundWithOptionalIds(args.input);
    return compound;
  },

  updateCompoundRelations: async (
    _parent: unknown,
    args: { input: CompoundUpdateRelationFieldsInput },
    ctx: GraphQLContext
  ) => {
    const compound = await updateCompoundWithRelationFields(args.input);
    return compound;
  },

  deleteCompound: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const compound = await deleteCompound(args.id);
    return compound;
  },

  createCaseStudy: async (
    _parent: unknown,
    args: { input: CaseStudyCreateWithOptionalIdsInput },
    _ctx: GraphQLContext
  ) => {
    const caseStudy = await createCaseStudyWithOptionalIds(args.input);
    return caseStudy;
  },

  updateCaseStudy: async (
    _parent: unknown,
    args: { input: CaseStudyUpdateWithOptionalIdsInput },
    _ctx: GraphQLContext
  ) => {
    const caseStudy = await updateCaseStudyWithOptionalIds(args.input);
    return caseStudy;
  },

  // --- Protocol mutations ---

  createProtocol: async (
    _parent: unknown,
    args: { input: ProtocolCreateWithOptionalIdsInput },
    _ctx: GraphQLContext
  ) => {
    const protocol = await createProtocolWithOptionalIds(args.input);
    return protocol;
  },

  updateProtocol: async (
    _parent: unknown,
    args: { input: ProtocolUpdateWithOptionalIdsInput },
    _ctx: GraphQLContext
  ) => {
    const protocol = await updateProtocolWithOptionalIds(args.input);
    return protocol;
  },

  updateProtocolRelations: async (
    _parent: unknown,
    args: { input: ProtocolUpdateRelationFieldsInput },
    _ctx: GraphQLContext
  ) => {
    const protocol = await updateProtocolWithRelationFields(args.input);
    return protocol;
  },
  embedProductDescription: async (
    _parent: unknown,
    args: { productId: string },
    ctx: GraphQLContext
  ) => {
    const product = await embedProductDescription(args.productId);
    if (!product) throw new Error("Product not found");
    return product;
  },
  embedBusinessDescription: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const business = await embedBusinessDescription(args.id);
    if (!business) throw new Error("Business not found");
    return business;
  },
  embedPersonBio: async (
    _parent: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    const person = await embedPersonBio(args.id);
    if (!person) throw new Error("Person not found");
    return person;
  },
  deleteBusiness: async (
    _parent: unknown,
    args: { id: string },
    _ctx: GraphQLContext
  ) => {
    const business = await deleteBusiness(args.id);
    return business;
  },
};
