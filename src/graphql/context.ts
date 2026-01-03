import { type Request, type Response } from "express";

export interface GraphQLContext {
  ip: string;
  requestId?: string;
  req?: Request;
  res?: Response;
}

export function createContext(params: {
  ip: string;
  requestId?: string;
  req?: Request;
  res?: Response;
}): GraphQLContext {
  return {
    ip: params.ip,
    requestId: params.requestId,
    req: params.req,
    res: params.res,
  };
}
