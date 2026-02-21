import { type Request, type Response } from "express";
import { createEntityLoaders, EntityLoaders } from "./loaders/entityLoaders.js";

export interface GraphQLContext {
  ip: string;
  requestId?: string;
  req?: Request;
  res?: Response;
  loaders: {
    entities: EntityLoaders;
  };
}

export function createContext(params: {
  ip: string;
  requestId?: string;
  req?: Request;
  res?: Response;
  loaders: {
    entities: EntityLoaders;
  };
}): GraphQLContext {
  return {
    ip: params.ip,
    requestId: params.requestId,
    req: params.req,
    res: params.res,
    loaders: {
      entities: createEntityLoaders(),
    },
  };
}
