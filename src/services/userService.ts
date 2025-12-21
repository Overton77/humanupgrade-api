import bcrypt from "bcryptjs";
import {
  User,
  type IUser,
  type UserDoc,
  type UserModel,
} from "../models/User.js";

import { BaseService } from "./BaseService.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";

import { mergeUniqueBy } from "./utils/merging.js";

import type { MediaLink } from "../models/MediaLink.js";
import type { UserUpsertInput } from "../graphql/inputs/userInputs.js";

import { UserUpsertInputSchema } from "../graphql/inputs/schemas/userSchemas.js";

import "dotenv/config";
import mongoose from "mongoose";

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

  async deleteUser(userId: mongoose.Types.ObjectId) {
    const existing = await User.findById(userId);

    if (!existing) {
      throw Errors.notFound("User");
    }

    const deletedUser = await User.findOneAndDelete(
      {
        _id: existing._id.toString(),
      },
      { returnOriginal: true }
    );

    // TODO : fix deletion strategy.

    return {
      message: `User with email ${deletedUser?.email} deleted`,
      success: true,
    };
  }
}

export const userService = new UserService();

export const upsertUser = (input: UserUpsertInput) =>
  userService.upsertUser(input);

export const deleteUser = (userId: mongoose.Types.ObjectId) =>
  userService.deleteUser(userId);
