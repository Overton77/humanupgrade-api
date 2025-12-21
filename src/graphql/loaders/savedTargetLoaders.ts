import DataLoader from "dataloader";
import mongoose from "mongoose";

import { Product } from "../../models/Product.js";
import { Compound } from "../../models/Compound.js";
import { Person } from "../../models/Person.js";
import { Business } from "../../models/Business.js";
import { Protocol } from "../../models/Protocol.js";
import { Episode } from "../../models/Episode.js";
import { CaseStudy } from "../../models/CaseStudy.js";
import { Article } from "../../models/Article.js";

function idKey(id: mongoose.Types.ObjectId): string {
  return id.toHexString();
}

function batchByIds<T extends { _id: mongoose.Types.ObjectId }>(
  model: any,
  ids: readonly mongoose.Types.ObjectId[]
): Promise<(T | null)[]> {
  return model.find({ _id: { $in: ids } }).then((docs: T[]) => {
    const map = new Map(docs.map((d) => [idKey(d._id), d]));
    return ids.map((id) => map.get(idKey(id)) ?? null);
  });
}

export function createSavedTargetLoaders() {
  return {
    productById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Product, ids)
    ),

    compoundById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Compound, ids)
    ),

    personById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Person, ids)
    ),

    businessById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Business, ids)
    ),

    protocolById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Protocol, ids)
    ),

    episodeById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Episode, ids)
    ),

    caseStudyById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(CaseStudy, ids)
    ),

    articleById: new DataLoader((ids: readonly mongoose.Types.ObjectId[]) =>
      batchByIds(Article, ids)
    ),
  };
}
