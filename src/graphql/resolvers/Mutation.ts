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
import {
  addSavedItemsToUser,
  removeSavedItemsFromUser,
  upsertUser,
  toggleSavedBusinessForUser,
  toggleSavedEpisodeForUser,
  toggleSavedProductForUser,
} from "../../services/userService.js";
import { UserMassSaveInput, UserUpsertInput } from "../inputs/userInputs.js";

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
  addSavedItemsToUser: async (
    _p: unknown,
    args: { input: UserMassSaveInput },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx); // probably only owner or admin in real life
    return addSavedItemsToUser(args.input);
  },

  removeSavedItemsFromUser: async (
    _p: unknown,
    args: { input: UserMassSaveInput },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    return removeSavedItemsFromUser(args.input);
  },

  toggleSaveEpisode: async (
    _parent: unknown,
    args: { episodeId: string },
    ctx: any
  ) => {
    requireAuth(ctx);
    return await toggleSavedEpisodeForUser(
      ctx.user!._id.toString(),
      args.episodeId
    );
  },

  toggleSaveProduct: async (
    _parent: unknown,
    args: { productId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    return await toggleSavedProductForUser(
      ctx.user!._id.toString(),
      args.productId
    );
  },

  toggleSaveBusiness: async (
    _parent: unknown,
    args: { businessId: string },
    ctx: any
  ) => {
    requireAuth(ctx);
    return await toggleSavedBusinessForUser(
      ctx.user!._id.toString(),
      args.businessId
    );
  },
  createBusinessWithRelations: async (
    _parent: unknown,
    args: { input: BusinessCreateRelationsInput },
    _ctx: any
  ) => {
    // args.input shape matches BusinessCreateWithOptionalIdsInput
    const business = await createBusinessWithRelations(args.input);
    return business;
  },

  updateBusiness: async (
    _parent: unknown,
    args: { input: BusinessUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const business = await updateBusinessWithOptionalIds(args.input);
    return business;
  },

  updateBusinessRelations: async (
    _parent: unknown,
    args: { input: BusinessUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const business = await updateBusinessWithRelationFields(args.input);
    return business;
  },

  // --- Product mutations ---

  createProduct: async (
    _parent: unknown,
    args: { input: ProductCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const product = await createProductWithOptionalIds(args.input);
    return product;
  },

  updateProduct: async (
    _parent: unknown,
    args: { input: ProductUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const product = await updateProductWithOptionalIds(args.input);
    return product;
  },

  updateProductRelations: async (
    _parent: unknown,
    args: { input: ProductUpdateRelationFieldsInput },
    _ctx: any
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
    _ctx: any
  ) => {
    const person = await createPerson(args.input);
    return person;
  },

  updatePerson: async (
    _parent: unknown,
    args: { input: PersonScalarUpdateFields },
    _ctx: any
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
    _ctx: any
  ) => {
    const episode = await createEpisodeWithOptionalIds(args.input);
    return episode;
  },

  updateEpisode: async (
    _parent: unknown,
    args: { input: EpisodeUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const episode = await updateEpisodeWithOptionalIds(args.input);
    return episode;
  },

  updateEpisodeRelations: async (
    _parent: unknown,
    args: { input: EpisodeUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const episode = await updateEpisodeWithRelationFields(args.input);
    return episode;
  },

  deleteEpisode: async (
    _parent: unknown,
    args: { identifier: string },
    _ctx: any
  ) => {
    const episode = await deleteEpisodeByPageUrlOrId(args.identifier);
    if (!episode) {
      throw new Error(`Episode not found with identifier: ${args.identifier}`);
    }
    return episode;
  },

  deleteAllEpisodes: async (_parent: unknown, _args: unknown, _ctx: any) => {
    const result = await deleteAllEpisodes();
    return result;
  },

  // --- Compound mutations ---

  createCompound: async (
    _parent: unknown,
    args: { input: CompoundCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const compound = await createCompoundWithOptionalIds(args.input);
    return compound;
  },

  updateCompound: async (
    _parent: unknown,
    args: { input: CompoundUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const compound = await updateCompoundWithOptionalIds(args.input);
    return compound;
  },

  updateCompoundRelations: async (
    _parent: unknown,
    args: { input: CompoundUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const compound = await updateCompoundWithRelationFields(args.input);
    return compound;
  },

  deleteCompound: async (_parent: unknown, args: { id: string }, _ctx: any) => {
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
