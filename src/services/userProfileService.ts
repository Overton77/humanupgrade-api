import mongoose from "mongoose";
import { UserProfile, type IUserProfile } from "../models/UserProfile.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";
import type { UserProfileUpsertInput } from "../graphql/inputs/userProfileInputs.js";
import { UserProfileUpsertInputSchema } from "../graphql/inputs/schemas/userProfileSchemas.js";
import { toObjectIds } from "./utils/general.js";

import { IUser, User } from "../models/User.js";

function toObjectId(id: string): mongoose.Types.ObjectId {
  return toObjectIds([id])[0];
}

export async function upsertUserProfile(
  input: UserProfileUpsertInput
): Promise<IUserProfile> {
  const v = validateInput(
    UserProfileUpsertInputSchema,
    input,
    "UserProfileUpsertInput"
  );

  const userIdObj = toObjectId(v.userId);

  const currentUser = await User.findById(userIdObj);
  if (!currentUser) {
    throw Errors.notFound("User not found");
  }

  // Pre-normalize IDs (avoid mixing strings/ObjectIds)
  const likedIds = v.entityPreferences?.likedEntityIds?.length
    ? toObjectIds(v.entityPreferences.likedEntityIds)
    : undefined;

  const hiddenIds = v.entityPreferences?.hiddenEntityIds?.length
    ? toObjectIds(v.entityPreferences.hiddenEntityIds)
    : undefined;

  const blockedIds = v.entityPreferences?.blockedEntityIds?.length
    ? toObjectIds(v.entityPreferences.blockedEntityIds)
    : undefined;

  const updatePipeline: Array<Record<string, unknown>> = [
    { $set: { userId: userIdObj } },

    {
      $set: {
        goals: { $ifNull: ["$goals", []] },
        avoidances: { $ifNull: ["$avoidances", []] },
        preferredFormats: { $ifNull: ["$preferredFormats", []] },
        topicInterests: { $ifNull: ["$topicInterests", []] },
      },
    },

    {
      $set: {
        experienceLevel:
          v.experienceLevel === undefined
            ? "$experienceLevel"
            : v.experienceLevel,
        dietStyle: v.dietStyle === undefined ? "$dietStyle" : v.dietStyle,
        timeBudget: v.timeBudget === undefined ? "$timeBudget" : v.timeBudget,
      },
    },

    {
      $set: {
        avoidances:
          v.avoidances === undefined
            ? { $ifNull: ["$avoidances", []] }
            : {
                $setUnion: [{ $ifNull: ["$avoidances", []] }, v.avoidances],
              },

        preferredFormats:
          v.preferredFormats === undefined
            ? { $ifNull: ["$preferredFormats", []] }
            : {
                $setUnion: [
                  { $ifNull: ["$preferredFormats", []] },
                  v.preferredFormats,
                ],
              },

        topicInterests:
          v.topicInterests === undefined
            ? { $ifNull: ["$topicInterests", []] }
            : {
                $setUnion: [
                  { $ifNull: ["$topicInterests", []] },
                  v.topicInterests,
                ],
              },
      },
    },

    ...(v.goals === undefined
      ? []
      : [
          {
            $set: {
              goals: {
                $let: {
                  vars: {
                    incoming: v.goals,
                    incomingTypes: {
                      $map: { input: v.goals, as: "g", in: "$$g.goalType" },
                    },
                  },
                  in: {
                    $concatArrays: [
                      {
                        $filter: {
                          input: { $ifNull: ["$goals", []] },
                          as: "eg",
                          cond: {
                            $not: { $in: ["$$eg.goalType", "$$incomingTypes"] },
                          },
                        },
                      },
                      "$$incoming",
                    ],
                  },
                },
              },
            },
          },
        ]),

    ...(v.entityPreferences === undefined
      ? []
      : [
          {
            $set: {
              entityPreferences: {
                $let: {
                  vars: {
                    existing: { $ifNull: ["$entityPreferences", {}] },
                  },
                  in: {
                    likedEntityIds:
                      likedIds === undefined
                        ? { $ifNull: ["$$existing.likedEntityIds", []] }
                        : {
                            $setUnion: [
                              { $ifNull: ["$$existing.likedEntityIds", []] },
                              likedIds,
                            ],
                          },

                    hiddenEntityIds:
                      hiddenIds === undefined
                        ? { $ifNull: ["$$existing.hiddenEntityIds", []] }
                        : {
                            $setUnion: [
                              { $ifNull: ["$$existing.hiddenEntityIds", []] },
                              hiddenIds,
                            ],
                          },

                    blockedEntityIds:
                      blockedIds === undefined
                        ? { $ifNull: ["$$existing.blockedEntityIds", []] }
                        : {
                            $setUnion: [
                              { $ifNull: ["$$existing.blockedEntityIds", []] },
                              blockedIds,
                            ],
                          },
                  },
                },
              },
            },
          },
          {
            $set: {
              createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
              updatedAt: "$$NOW",
            },
          },
        ]),
  ];

  const updated = await UserProfile.findOneAndUpdate(
    { userId: userIdObj },
    updatePipeline,
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      updatePipeline: true,
      timestamps: true,
    }
  );

  if (!updated) {
    throw Errors.internalError(
      "Failed to upsert UserProfile",
      new Error("Failed to upsert UserProfile")
    );
  }

  return updated;
}

export async function deleteUserProfile(
  userId: string
): Promise<{ deletedCount: number }> {
  const userIdObj = toObjectIds([userId])[0];

  const currentUser = await User.findById(userIdObj).populate("profile");

  if (!currentUser) {
    throw Errors.notFound("User not found");
  }

  if (!currentUser.profile) {
    throw Errors.notFound("UserProfile not found");
  }

  const result = await UserProfile.findOneAndDelete({
    userId: currentUser._id,
  });

  if (!result) {
    throw Errors.notFound("UserProfile", userId);
  }

  return { deletedCount: 1 };
}

export async function getMe(user: IUser): Promise<IUserProfile> {
  const userProfile = await UserProfile.findOne({ userId: user._id });

  if (!userProfile) {
    throw Errors.notFound(
      `User with email has not created a profile yet. Use the web app to make a profile`
    );
  }

  return userProfile;
}
