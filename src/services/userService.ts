import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { MediaLink } from "../models/MediaLink";
import { mergeAndDedupeIds } from "./utils/merging";
import { toObjectIds, removeIds, toggleObjectIdInArray } from "./utils/general";
import { GraphQLError } from "graphql";
import {
  UserUpsertInput,
  UserMassSaveInput,
} from "../graphql/inputs/userInputs";
import { mergeUniqueBy } from "./utils/merging";
import { Episode } from "../models/Episode";
import { Product } from "../models/Product";
import { Business } from "../models/Business";

const SALT_ROUNDS = 10; // CONSTANT

export async function upsertUser(input: UserUpsertInput): Promise<IUser> {
  const { email, password, provider, providerId, name, role, mediaLinks } =
    input;

  let user = await User.findOne({ email });

  if (!user) {
    // Delegate to create-like behavior
    throw new GraphQLError("User not found", {
      extensions: { code: "USER_NOT_FOUND" },
    });
  }

  // Update fields only if provided
  if (typeof name === "string") {
    user.name = name;
  }

  if (typeof role === "string") {
    user.role = role;
  }

  if (typeof provider === "string") {
    user.provider = provider;
  }

  if (typeof providerId === "string") {
    user.providerId = providerId;
  }

  if (Array.isArray(mediaLinks)) {
    user.mediaLinks = mergeUniqueBy(
      user.mediaLinks ?? [],
      mediaLinks,
      (m) => m.url
    );
  }

  if (password) {
    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  await user.save();
  return user;
}

export async function addSavedItemsToUser(
  input: UserMassSaveInput
): Promise<IUser> {
  const { userId, episodeIds, productIds, businessIds } = input;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Ensure arrays exist
  user.savedEpisodes = user.savedEpisodes || [];
  user.savedProducts = user.savedProducts || [];
  user.savedBusinesses = user.savedBusinesses || [];

  if (episodeIds && episodeIds.length > 0) {
    user.savedEpisodes = mergeAndDedupeIds(user.savedEpisodes, episodeIds);
  }

  if (productIds && productIds.length > 0) {
    user.savedProducts = mergeAndDedupeIds(user.savedProducts, productIds);
  }

  if (businessIds && businessIds.length > 0) {
    user.savedBusinesses = mergeAndDedupeIds(user.savedBusinesses, businessIds);
  }

  await user.save();
  return user;
}

export async function removeSavedItemsFromUser(
  input: UserMassSaveInput
): Promise<IUser> {
  const { userId, episodeIds, productIds, businessIds } = input;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.savedEpisodes = user.savedEpisodes || [];
  user.savedProducts = user.savedProducts || [];
  user.savedBusinesses = user.savedBusinesses || [];

  if (episodeIds && episodeIds.length > 0) {
    user.savedEpisodes = removeIds(user.savedEpisodes, episodeIds);
  }

  if (productIds && productIds.length > 0) {
    user.savedProducts = removeIds(user.savedProducts, productIds);
  }

  if (businessIds && businessIds.length > 0) {
    user.savedBusinesses = removeIds(user.savedBusinesses, businessIds);
  }

  await user.save();
  return user;
}

export async function toggleSavedEpisodeForUser(
  userId: string,
  episodeId: string
): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const episode = await Episode.findById(episodeId);
  if (!episode) {
    throw new Error("Episode not found");
  }

  user.savedEpisodes = user.savedEpisodes || [];
  user.savedEpisodes = toggleObjectIdInArray(user.savedEpisodes, episode._id);

  await user.save();
  return user;
}

export async function toggleSavedProductForUser(
  userId: string,
  productId: string
): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  user.savedProducts = user.savedProducts || [];
  user.savedProducts = toggleObjectIdInArray(user.savedProducts, product._id);

  await user.save();
  return user;
}

export async function toggleSavedBusinessForUser(
  userId: string,
  businessId: string
): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error("Business not found");
  }

  user.savedBusinesses = user.savedBusinesses || [];
  user.savedBusinesses = toggleObjectIdInArray(
    user.savedBusinesses,
    business._id
  );

  await user.save();
  return user;
}
