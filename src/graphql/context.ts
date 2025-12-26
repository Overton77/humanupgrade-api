import DataLoader from "dataloader";
import type { IUser } from "../models/User.js";
import { getUserByIdCached, type Role } from "../services/auth.js";

import { createEntityLoaders, EntityLoaders } from "./loaders/entityLoaders.js";

export interface GraphQLContext {
  userId: string | null;
  role: Role | null;
  ip: string;

  loaders: {
    userById: DataLoader<string, IUser | null>;
    entities: EntityLoaders;
  };

  requestId?: string;
}

export function createContext(params: {
  userId: string | null;
  role: Role | null;
  requestId?: string;
  ip: string;
}): GraphQLContext {
  const { userId, role, requestId, ip } = params;

  const userById = new DataLoader<string, IUser | null>(
    async (ids) => {
      const results = await Promise.all(ids.map((id) => getUserByIdCached(id)));
      return results;
    },
    {
      cacheKeyFn: (key) => key.toString(),
    }
  );

  return {
    userId,
    role,
    ip,
    loaders: {
      userById,
      entities: createEntityLoaders(),
    },
    requestId,
  };
}
