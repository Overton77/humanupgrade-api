import DataLoader from "dataloader";
import { type HydratedDocument, type Model } from "mongoose";

import { Product, type IProduct } from "../../models/Product.js";
import { Compound, type ICompound } from "../../models/Compound.js";
import { Person, type IPerson } from "../../models/Person.js";
import { Business, type IBusiness } from "../../models/Business.js";
import { Protocol, type IProtocol } from "../../models/Protocol.js";
import { Episode, type IEpisode } from "../../models/Episode.js";
import { CaseStudy, type ICaseStudy } from "../../models/CaseStudy.js";
import { Article, type IArticle } from "../../models/Article.js";
import { ObjectId, batchByIds, asModel, groupByKey, idKey } from "./utils.js";

export interface EntityLoaders {
  // Core byId loaders
  productById: DataLoader<ObjectId, HydratedDocument<IProduct> | null>;
  compoundById: DataLoader<ObjectId, HydratedDocument<ICompound> | null>;
  personById: DataLoader<ObjectId, HydratedDocument<IPerson> | null>;
  businessById: DataLoader<ObjectId, HydratedDocument<IBusiness> | null>;
  protocolById: DataLoader<ObjectId, HydratedDocument<IProtocol> | null>;
  episodeById: DataLoader<ObjectId, HydratedDocument<IEpisode> | null>;
  caseStudyById: DataLoader<ObjectId, HydratedDocument<ICaseStudy> | null>;
  articleById: DataLoader<ObjectId, HydratedDocument<IArticle> | null>;

  // Reverse lookups
  caseStudiesByCompoundId: DataLoader<ObjectId, HydratedDocument<ICaseStudy>[]>;
  caseStudiesByProductId: DataLoader<ObjectId, HydratedDocument<ICaseStudy>[]>;
  caseStudiesByProtocolId: DataLoader<ObjectId, HydratedDocument<ICaseStudy>[]>;
  caseStudiesByEpisodeId: DataLoader<ObjectId, HydratedDocument<ICaseStudy>[]>;
}

export function createEntityLoaders(): EntityLoaders {
  // --- Core byId loaders ---
  const productById = new DataLoader<
    ObjectId,
    HydratedDocument<IProduct> | null
  >((ids) => batchByIds<IProduct>(asModel<IProduct>(Product), ids));

  const compoundById = new DataLoader<
    ObjectId,
    HydratedDocument<ICompound> | null
  >((ids) => batchByIds<ICompound>(asModel<ICompound>(Compound), ids));

  const personById = new DataLoader<ObjectId, HydratedDocument<IPerson> | null>(
    (ids) => batchByIds<IPerson>(asModel<IPerson>(Person), ids)
  );

  const businessById = new DataLoader<
    ObjectId,
    HydratedDocument<IBusiness> | null
  >((ids) => batchByIds<IBusiness>(asModel<IBusiness>(Business), ids));

  const protocolById = new DataLoader<
    ObjectId,
    HydratedDocument<IProtocol> | null
  >((ids) => batchByIds<IProtocol>(asModel<IProtocol>(Protocol), ids));

  const episodeById = new DataLoader<
    ObjectId,
    HydratedDocument<IEpisode> | null
  >((ids) => batchByIds<IEpisode>(asModel<IEpisode>(Episode), ids));

  const caseStudyById = new DataLoader<
    ObjectId,
    HydratedDocument<ICaseStudy> | null
  >((ids) => batchByIds<ICaseStudy>(asModel<ICaseStudy>(CaseStudy), ids));

  const articleById = new DataLoader<
    ObjectId,
    HydratedDocument<IArticle> | null
  >((ids) => batchByIds<IArticle>(asModel<IArticle>(Article), ids));

  // --- Reverse lookups: CaseStudy by foreign key (compoundIds, productIds, etc.) ---
  const caseStudiesByCompoundId = new DataLoader<
    ObjectId,
    HydratedDocument<ICaseStudy>[]
  >(async (compoundIds) => {
    const docs = await CaseStudy.find({ compoundIds: { $in: compoundIds } });
    const grouped = groupByKey(docs, (d) => {
      return "" as string;
    });

    const map = new Map<string, HydratedDocument<ICaseStudy>[]>();
    for (const cs of docs) {
      for (const cid of cs.compoundIds ?? []) {
        const k = idKey(cid as ObjectId);
        const arr = map.get(k);
        if (arr) arr.push(cs as HydratedDocument<ICaseStudy>);
        else map.set(k, [cs as HydratedDocument<ICaseStudy>]);
      }
    }

    return compoundIds.map((id) => map.get(idKey(id)) ?? []);
  });

  const caseStudiesByProductId = new DataLoader<
    ObjectId,
    HydratedDocument<ICaseStudy>[]
  >(async (productIds) => {
    const docs = await CaseStudy.find({ productIds: { $in: productIds } });

    const map = new Map<string, HydratedDocument<ICaseStudy>[]>();
    for (const cs of docs) {
      for (const pid of cs.productIds ?? []) {
        const k = idKey(pid as ObjectId);
        const arr = map.get(k);
        if (arr) arr.push(cs as HydratedDocument<ICaseStudy>);
        else map.set(k, [cs as HydratedDocument<ICaseStudy>]);
      }
    }

    return productIds.map((id) => map.get(idKey(id)) ?? []);
  });

  const caseStudiesByProtocolId = new DataLoader<
    ObjectId,
    HydratedDocument<ICaseStudy>[]
  >(async (protocolIds) => {
    const docs = await CaseStudy.find({ protocolIds: { $in: protocolIds } });

    const map = new Map<string, HydratedDocument<ICaseStudy>[]>();
    for (const cs of docs) {
      for (const pid of cs.protocolIds ?? []) {
        const k = idKey(pid as ObjectId);
        const arr = map.get(k);
        if (arr) arr.push(cs as HydratedDocument<ICaseStudy>);
        else map.set(k, [cs as HydratedDocument<ICaseStudy>]);
      }
    }

    return protocolIds.map((id) => map.get(idKey(id)) ?? []);
  });

  const caseStudiesByEpisodeId = new DataLoader<
    ObjectId,
    HydratedDocument<ICaseStudy>[]
  >(async (episodeIds) => {
    const docs = await CaseStudy.find({ episodeIds: { $in: episodeIds } });

    const map = new Map<string, HydratedDocument<ICaseStudy>[]>();
    for (const cs of docs) {
      for (const eid of cs.episodeIds ?? []) {
        const k = idKey(eid as ObjectId);
        const arr = map.get(k);
        if (arr) arr.push(cs as HydratedDocument<ICaseStudy>);
        else map.set(k, [cs as HydratedDocument<ICaseStudy>]);
      }
    }

    return episodeIds.map((id) => map.get(idKey(id)) ?? []);
  });

  return {
    productById,
    compoundById,
    personById,
    businessById,
    protocolById,
    episodeById,
    caseStudyById,
    articleById,

    caseStudiesByCompoundId,
    caseStudiesByProductId,
    caseStudiesByProtocolId,
    caseStudiesByEpisodeId,
  };
}
