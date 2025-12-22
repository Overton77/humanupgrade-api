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

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

// TODO add self edit this is Admin upsert user

class UserService extends BaseService<IUser, UserDoc, UserModel> {
  constructor() {
    super(User, "userService", "User");
  }

  async upsertUser(input: UserUpsertInput): Promise<IUser> {
    const v = validateInput(UserUpsertInputSchema, input, "UserUpsertInput");

    const {
      userId,
      email,
      password,
      provider,
      providerId,
      name,
      role,
      mediaLinks,
    } = v;

    if (!userId && !email) {
      throw Errors.invalidInput("Either userId or email is required", "email");
    }

    const targetEmail = email ? normEmail(email) : undefined;

    // 1) Load user by userId or email
    let user: IUser | null = null;

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw Errors.invalidInput("Invalid userId", "userId");
      }
      user = await User.findById(userId);
      if (!user) throw Errors.notFound("User", userId);
    } else if (targetEmail) {
      user = await User.findOne({ email: targetEmail });
    }

    // 2) If not found, create
    if (!user) {
      // Creating a user requires email
      if (!targetEmail) {
        throw Errors.invalidInput(
          "Email is required to create a user",
          "email"
        );
      }

      // If password isn't provided for local users, you can decide policy
      // For now: allow create without password only if provider != local
      const creatingProvider = provider ?? "local";
      if (creatingProvider === "local" && !password) {
        throw Errors.invalidInput(
          "Password is required for local user creation",
          "password"
        );
      }

      user = new User({
        email: targetEmail,
        provider: creatingProvider,
        providerId,
        name,
        role: role ?? "user",
        mediaLinks: [],
      });

      if (password) {
        user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      }
    } else {
      if (targetEmail && targetEmail !== normEmail(user.email)) {
        const existing = await User.findOne({ email: targetEmail }).select(
          "_id"
        );
        if (existing && existing._id.toString() !== user._id.toString()) {
          throw Errors.duplicate("User", targetEmail);
        }
        user.email = targetEmail;
      }

      if (provider !== undefined) user.provider = provider;
      if (providerId !== undefined) user.providerId = providerId;
      if (name !== undefined) user.name = name;
      if (role !== undefined) user.role = role;

      if (mediaLinks !== undefined) {
        const valid = mediaLinks.filter((m): m is MediaLink => !!m?.url);
        user.mediaLinks = mergeUniqueBy(
          user.mediaLinks ?? [],
          valid,
          (m) => m.url
        );
      }

      if (password) {
        user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      }
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
