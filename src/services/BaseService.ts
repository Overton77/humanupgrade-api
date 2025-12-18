import { Model, HydratedDocument, ClientSession } from "mongoose";
import { Errors } from "../lib/errors.js";
import { withErrorHandling } from "../lib/serviceWrapper.js";
import { validateEntitiesExist } from "./utils/validation.js";
import type { LogContext } from "../lib/logger.js";

export abstract class BaseService<
  TSchema,
  TDoc extends HydratedDocument<TSchema>,
  TModel extends Model<TSchema>
> {
  protected model: TModel;
  protected serviceName: string;
  protected entityName: string;

  constructor(model: TModel, serviceName: string, entityName: string) {
    this.model = model;
    this.serviceName = serviceName;
    this.entityName = entityName;
  }

  async findById(
    id: string,
    opts?: { session?: ClientSession; context?: LogContext }
  ): Promise<TDoc> {
    const { session, context } = opts ?? {};
    return withErrorHandling(
      "findById",
      this.serviceName,
      async () => {
        const doc = await this.model.findById(id).session(session ?? null);
        if (!doc) throw Errors.notFound(this.entityName, id);
        return doc as TDoc;
      },
      { id, ...context }
    );
  }

  async findByIdOrNull(
    id: string,
    opts?: { session?: ClientSession; context?: LogContext }
  ): Promise<TDoc | null> {
    const { session, context } = opts ?? {};
    return withErrorHandling(
      "findByIdOrNull",
      this.serviceName,
      async () =>
        (await this.model.findById(id).session(session ?? null)) as TDoc | null,
      { id, ...context }
    );
  }

  protected async validateEntities<M>(
    model: Model<M>,
    ids: string[],
    entityType: string,
    opts?: { session?: ClientSession; context?: LogContext }
  ): Promise<void> {
    const { session, context } = opts ?? {};
    return withErrorHandling(
      "validateEntities",
      this.serviceName,
      async () =>
        validateEntitiesExist(model as any, ids, entityType, { session }),
      { entityType, ids, ...context }
    );
  }

  /**
   * Preferred delete: triggers findOneAndDelete hooks and supports sessions.
   */
  async deleteById(
    id: string,
    opts?: { session?: ClientSession; context?: LogContext }
  ): Promise<TDoc> {
    const { session, context } = opts ?? {};
    return withErrorHandling(
      "deleteById",
      this.serviceName,
      async () => {
        const doc = await this.model.findOneAndDelete(
          { _id: id } as any,
          session ? { session } : undefined
        );
        if (!doc) throw Errors.notFound(this.entityName, id);
        return doc as TDoc;
      },
      { id, ...context }
    );
  }
}
