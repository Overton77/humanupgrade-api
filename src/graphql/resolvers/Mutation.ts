import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { Episode } from "../../models/Episode";
import { Product } from "../../models/Product";
import { Business } from "../../models/Business";
import { Person } from "../../models/Person";
import { Compound } from "../../models/Compound";
import { signAuthToken } from "../../services/auth";
import { Context } from "../../services/auth";
import {
  createBusinessWithOptionalIds,
  updateBusinessWithOptionalIds,
  updateBusinessWithRelationFields,
} from "../../services/businessService";
import {
  BusinessCreateWithOptionalIdsInput,
  BusinessUpdateWithOptionalIdsInput,
  BusinessUpdateRelationFieldsInput,
} from "../inputs/businessInputs";
import {
  createProductWithOptionalIds,
  updateProductWithOptionalIds,
  updateProductWithRelationFields,
} from "../../services/productService";
import {
  ProductCreateWithOptionalIdsInput,
  ProductUpdateWithOptionalIdsInput,
  ProductUpdateRelationFieldsInput,
} from "../inputs/productInputs";
import {
  createPersonWithOptionalIds,
  updatePersonWithOptionalIds,
  updatePersonWithRelationFields,
} from "../../services/personService";
import {
  PersonCreateWithOptionalIdsInput,
  PersonUpdateWithOptionalIdsInput,
  PersonUpdateRelationFieldsInput,
} from "../inputs/personInputs";
import {
  createEpisodeWithOptionalIds,
  updateEpisodeWithOptionalIds,
  updateEpisodeWithRelationFields,
} from "../../services/episodeService";
import {
  EpisodeCreateWithOptionalIdsInput,
  EpisodeUpdateWithOptionalIdsInput,
  EpisodeUpdateRelationFieldsInput,
} from "../inputs/episodeInputs";
import {
  createCompoundWithOptionalIds,
  updateCompoundWithOptionalIds,
  updateCompoundWithRelationFields,
} from "../../services/compoundService";
import {
  CompoundCreateWithOptionalIdsInput,
  CompoundUpdateWithOptionalIdsInput,
  CompoundUpdateRelationFieldsInput,
} from "../inputs/compoundInputs";

import {
  createCaseStudyWithOptionalIds,
  updateCaseStudyWithOptionalIds,
} from "../../services/caseStudyService";
import {
  CaseStudyCreateWithOptionalIdsInput,
  CaseStudyUpdateWithOptionalIdsInput,
} from "../inputs/caseStudyInputs";

import { requireAuth, requireAdmin } from "../../services/auth";
import {
  addSavedItemsToUser,
  removeSavedItemsFromUser,
  upsertUser,
  toggleSavedBusinessForUser,
  toggleSavedEpisodeForUser,
  toggleSavedProductForUser,
} from "../../services/userService";
import { UserMassSaveInput, UserUpsertInput } from "../inputs/userInputs";

const SALT_ROUNDS = 10;

export const Mutation = {
  register: async (
    _parent: unknown,
    args: {
      email: string;
      password: string;
      name?: string;
      role?: "admin" | "user";
    }
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
    ctx: Context
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
    ctx: Context
  ) => {
    requireAuth(ctx); // probably only owner or admin in real life
    return addSavedItemsToUser(args.input);
  },

  removeSavedItemsFromUser: async (
    _p: unknown,
    args: { input: UserMassSaveInput },
    ctx: Context
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
    ctx: Context
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
  createBusiness: async (
    _parent: unknown,
    args: { input: BusinessCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    // args.input shape matches BusinessCreateWithOptionalIdsInput
    const business = await createBusinessWithOptionalIds(args.input);
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

  // --- Person mutations ---

  createPerson: async (
    _parent: unknown,
    args: { input: PersonCreateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const person = await createPersonWithOptionalIds(args.input);
    return person;
  },

  updatePerson: async (
    _parent: unknown,
    args: { input: PersonUpdateWithOptionalIdsInput },
    _ctx: any
  ) => {
    const person = await updatePersonWithOptionalIds(args.input);
    return person;
  },

  updatePersonRelations: async (
    _parent: unknown,
    args: { input: PersonUpdateRelationFieldsInput },
    _ctx: any
  ) => {
    const person = await updatePersonWithRelationFields(args.input);
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

  createCaseStudy: async (
    _parent: unknown,
    args: { input: CaseStudyCreateWithOptionalIdsInput },
    _ctx: Context
  ) => {
    const caseStudy = await createCaseStudyWithOptionalIds(args.input);
    return caseStudy;
  },

  updateCaseStudy: async (
    _parent: unknown,
    args: { input: CaseStudyUpdateWithOptionalIdsInput },
    _ctx: Context
  ) => {
    const caseStudy = await updateCaseStudyWithOptionalIds(args.input);
    return caseStudy;
  },
};
