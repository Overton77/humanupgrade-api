import bcrypt from "bcryptjs";
import {
  User,
  type IUser,
  type UserDoc,
  type UserModel,
} from "../models/User.js";
import { Episode } from "../models/Episode.js";
import { Product } from "../models/Product.js";
import { Business } from "../models/Business.js";
import { Protocol } from "../models/Protocol.js";
import { Compound } from "../models/Compound.js";
import { CaseStudy } from "../models/CaseStudy.js";
import { Person } from "../models/Person.js";

import { BaseService } from "./BaseService.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";

import { mergeUniqueBy } from "./utils/merging.js";
import { toggleObjectIdInArray, toObjectIds } from "./utils/general.js";

import type { MediaLink } from "../models/MediaLink.js";
import type {
  UserUpsertInput,
  UserMassSaveInput,
} from "../graphql/inputs/userInputs.js";

import {
  UserUpsertInputSchema,
  UserMassSaveInputSchema,
} from "../graphql/inputs/schemas/userSchemas.js";

import "dotenv/config";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

class UserService extends BaseService<IUser, UserDoc, UserModel> {
  constructor() {
    super(User, "userService", "User");
  }

  async upsertUser(input: UserUpsertInput): Promise<IUser> {
    const validated = validateInput(
      UserUpsertInputSchema,
      input,
      "UserUpsertInput"
    );

    const { email, password, provider, providerId, name, role, mediaLinks } =
      validated;

    const user = await User.findOne({ email });
    if (!user) {
      throw Errors.notFound("User", email);
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (provider !== undefined) user.provider = provider;
    if (providerId !== undefined) user.providerId = providerId;

    if (mediaLinks !== undefined) {
      const valid = mediaLinks.filter((m): m is MediaLink => !!m.url);
      user.mediaLinks = mergeUniqueBy(
        user.mediaLinks ?? [],
        valid,
        (m) => m.url
      );
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();
    return user;
  }

  async addSavedItemsToUser(input: UserMassSaveInput): Promise<IUser> {
    const validated = validateInput(
      UserMassSaveInputSchema,
      input,
      "UserMassSaveInput"
    );

    const {
      userId,
      episodeIds,
      productIds,
      businessIds,
      protocolIds,
      compoundIds,
      caseStudyIds,
      personIds,
    } = validated;

    // Optional existence checks (keep or remove depending on read load tolerance)
    if (episodeIds?.length)
      await this.validateEntities(Episode, episodeIds, "Episode");
    if (productIds?.length)
      await this.validateEntities(Product, productIds, "Product");
    if (businessIds?.length)
      await this.validateEntities(Business, businessIds, "Business");
    if (protocolIds?.length)
      await this.validateEntities(Protocol, protocolIds, "Protocol");
    if (compoundIds?.length)
      await this.validateEntities(Compound, compoundIds, "Compound");
    if (caseStudyIds?.length)
      await this.validateEntities(CaseStudy, caseStudyIds, "CaseStudy");
    if (personIds?.length)
      await this.validateEntities(Person, personIds, "Person");

    const addToSet: Record<string, any> = {};

    if (episodeIds?.length)
      addToSet.savedEpisodes = { $each: toObjectIds(episodeIds) };
    if (productIds?.length)
      addToSet.savedProducts = { $each: toObjectIds(productIds) };
    if (businessIds?.length)
      addToSet.savedBusinesses = { $each: toObjectIds(businessIds) };
    if (protocolIds?.length)
      addToSet.savedProtocols = { $each: toObjectIds(protocolIds) };
    if (compoundIds?.length)
      addToSet.savedCompounds = { $each: toObjectIds(compoundIds) };
    if (caseStudyIds?.length)
      addToSet.savedCaseStudies = { $each: toObjectIds(caseStudyIds) };
    if (personIds?.length)
      addToSet.savedPersons = { $each: toObjectIds(personIds) };

    const user = await User.findByIdAndUpdate(
      userId,
      Object.keys(addToSet).length ? { $addToSet: addToSet } : {},
      { new: true }
    );

    if (!user) throw Errors.notFound("User", userId);
    return user;
  }

  async removeSavedItemsFromUser(input: UserMassSaveInput): Promise<IUser> {
    const validated = validateInput(
      UserMassSaveInputSchema,
      input,
      "UserMassSaveInput"
    );

    const {
      userId,
      episodeIds,
      productIds,
      businessIds,
      protocolIds,
      compoundIds,
      caseStudyIds,
      personIds,
    } = validated;

    const pull: Record<string, any> = {};

    if (episodeIds?.length)
      pull.savedEpisodes = { $in: toObjectIds(episodeIds) };
    if (productIds?.length)
      pull.savedProducts = { $in: toObjectIds(productIds) };
    if (businessIds?.length)
      pull.savedBusinesses = { $in: toObjectIds(businessIds) };
    if (protocolIds?.length)
      pull.savedProtocols = { $in: toObjectIds(protocolIds) };
    if (compoundIds?.length)
      pull.savedCompounds = { $in: toObjectIds(compoundIds) };
    if (caseStudyIds?.length)
      pull.savedCaseStudies = { $in: toObjectIds(caseStudyIds) };
    if (personIds?.length) pull.savedPersons = { $in: toObjectIds(personIds) };

    const user = await User.findByIdAndUpdate(
      userId,
      Object.keys(pull).length ? { $pull: pull } : {},
      { new: true }
    );

    if (!user) throw Errors.notFound("User", userId);
    return user;
  }

  async toggleSavedEpisodeForUser(
    userId: string,
    episodeId: string
  ): Promise<IUser> {
    const episode = await Episode.findById(episodeId).select("_id");
    if (!episode) throw Errors.notFound("Episode", episodeId);

    const user = await this.findById(userId);
    user.savedEpisodes = user.savedEpisodes ?? [];
    user.savedEpisodes = toggleObjectIdInArray(user.savedEpisodes, episode._id);
    await user.save();
    return user;
  }

  async toggleSavedProductForUser(
    userId: string,
    productId: string
  ): Promise<IUser> {
    const product = await Product.findById(productId).select("_id");
    if (!product) throw Errors.notFound("Product", productId);

    const user = await this.findById(userId);
    user.savedProducts = user.savedProducts ?? [];
    user.savedProducts = toggleObjectIdInArray(user.savedProducts, product._id);
    await user.save();
    return user;
  }

  async toggleSavedBusinessForUser(
    userId: string,
    businessId: string
  ): Promise<IUser> {
    const business = await Business.findById(businessId).select("_id");
    if (!business) throw Errors.notFound("Business", businessId);

    const user = await this.findById(userId);
    user.savedBusinesses = user.savedBusinesses ?? [];
    user.savedBusinesses = toggleObjectIdInArray(
      user.savedBusinesses,
      business._id
    );
    await user.save();
    return user;
  }

  async toggleSavedProtocolForUser(
    userId: string,
    protocolId: string
  ): Promise<IUser> {
    const protocol = await Protocol.findById(protocolId).select("_id");
    if (!protocol) throw Errors.notFound("Protocol", protocolId);

    const user = await this.findById(userId);
    user.savedProtocols = user.savedProtocols ?? [];
    user.savedProtocols = toggleObjectIdInArray(
      user.savedProtocols,
      protocol._id
    );
    await user.save();
    return user;
  }

  async toggleSavedCompoundForUser(
    userId: string,
    compoundId: string
  ): Promise<IUser> {
    const compound = await Compound.findById(compoundId).select("_id");
    if (!compound) throw Errors.notFound("Compound", compoundId);

    const user = await this.findById(userId);
    user.savedCompounds = user.savedCompounds ?? [];
    user.savedCompounds = toggleObjectIdInArray(
      user.savedCompounds,
      compound._id
    );
    await user.save();
    return user;
  }

  async toggleSavedCaseStudyForUser(
    userId: string,
    caseStudyId: string
  ): Promise<IUser> {
    const cs = await CaseStudy.findById(caseStudyId).select("_id");
    if (!cs) throw Errors.notFound("CaseStudy", caseStudyId);

    const user = await this.findById(userId);
    user.savedCaseStudies = user.savedCaseStudies ?? [];
    user.savedCaseStudies = toggleObjectIdInArray(
      user.savedCaseStudies,
      cs._id
    );
    await user.save();
    return user;
  }

  async toggleSavedPersonForUser(
    userId: string,
    personId: string
  ): Promise<IUser> {
    const person = await Person.findById(personId).select("_id");
    if (!person) throw Errors.notFound("Person", personId);

    const user = await this.findById(userId);
    user.savedPersons = user.savedPersons ?? [];
    user.savedPersons = toggleObjectIdInArray(user.savedPersons, person._id);
    await user.save();
    return user;
  }
}

export const userService = new UserService();

export const upsertUser = (input: UserUpsertInput) =>
  userService.upsertUser(input);
export const addSavedItemsToUser = (input: UserMassSaveInput) =>
  userService.addSavedItemsToUser(input);
export const removeSavedItemsFromUser = (input: UserMassSaveInput) =>
  userService.removeSavedItemsFromUser(input);

export const toggleSavedEpisodeForUser = (userId: string, episodeId: string) =>
  userService.toggleSavedEpisodeForUser(userId, episodeId);
export const toggleSavedProductForUser = (userId: string, productId: string) =>
  userService.toggleSavedProductForUser(userId, productId);
export const toggleSavedBusinessForUser = (
  userId: string,
  businessId: string
) => userService.toggleSavedBusinessForUser(userId, businessId);
export const toggleSavedProtocolForUser = (
  userId: string,
  protocolId: string
) => userService.toggleSavedProtocolForUser(userId, protocolId);
export const toggleSavedCompoundForUser = (
  userId: string,
  compoundId: string
) => userService.toggleSavedCompoundForUser(userId, compoundId);
export const toggleSavedCaseStudyForUser = (
  userId: string,
  caseStudyId: string
) => userService.toggleSavedCaseStudyForUser(userId, caseStudyId);
export const toggleSavedPersonForUser = (userId: string, personId: string) =>
  userService.toggleSavedPersonForUser(userId, personId);
