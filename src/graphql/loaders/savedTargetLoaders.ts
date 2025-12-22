import DataLoader from "dataloader";
import mongoose, { HydratedDocument, Model } from "mongoose";

import { IProduct, Product } from "../../models/Product.js";
import { Compound, ICompound } from "../../models/Compound.js";
import { IPerson, Person } from "../../models/Person.js";
import { Business, IBusiness } from "../../models/Business.js";
import { IProtocol, Protocol } from "../../models/Protocol.js";
import { Episode, IEpisode } from "../../models/Episode.js";
import { CaseStudy, ICaseStudy } from "../../models/CaseStudy.js";
import { Article, IArticle } from "../../models/Article.js";
import { ObjectId, batchByIds } from "./utils.js";

export interface SavedTargetLoaders {
  productById: DataLoader<ObjectId, HydratedDocument<IProduct> | null>;
  compoundById: DataLoader<ObjectId, HydratedDocument<ICompound> | null>;
  personById: DataLoader<ObjectId, HydratedDocument<IPerson> | null>;
  businessById: DataLoader<ObjectId, HydratedDocument<IBusiness> | null>;
  protocolById: DataLoader<ObjectId, HydratedDocument<IProtocol> | null>;
  episodeById: DataLoader<ObjectId, HydratedDocument<IEpisode> | null>;
  caseStudyById: DataLoader<ObjectId, HydratedDocument<ICaseStudy> | null>;
  articleById: DataLoader<ObjectId, HydratedDocument<IArticle> | null>;
}

export function createSavedTargetLoaders(): SavedTargetLoaders {
  return {
    productById: new DataLoader<ObjectId, HydratedDocument<IProduct> | null>(
      (ids) =>
        batchByIds<IProduct>(
          Product as unknown as mongoose.Model<IProduct>,
          ids
        )
    ),

    compoundById: new DataLoader<ObjectId, HydratedDocument<ICompound> | null>(
      (ids) =>
        batchByIds<ICompound>(
          Compound as unknown as mongoose.Model<ICompound>,
          ids
        )
    ),

    personById: new DataLoader<ObjectId, HydratedDocument<IPerson> | null>(
      (ids) =>
        batchByIds<IPerson>(Person as unknown as mongoose.Model<IPerson>, ids)
    ),

    businessById: new DataLoader<ObjectId, HydratedDocument<IBusiness> | null>(
      (ids) =>
        batchByIds<IBusiness>(
          Business as unknown as mongoose.Model<IBusiness>,
          ids
        )
    ),

    protocolById: new DataLoader<ObjectId, HydratedDocument<IProtocol> | null>(
      (ids) =>
        batchByIds<IProtocol>(
          Protocol as unknown as mongoose.Model<IProtocol>,
          ids
        )
    ),

    episodeById: new DataLoader<ObjectId, HydratedDocument<IEpisode> | null>(
      (ids) =>
        batchByIds<IEpisode>(
          Episode as unknown as mongoose.Model<IEpisode>,
          ids
        )
    ),

    caseStudyById: new DataLoader<
      ObjectId,
      HydratedDocument<ICaseStudy> | null
    >((ids) =>
      batchByIds<ICaseStudy>(
        CaseStudy as unknown as mongoose.Model<ICaseStudy>,
        ids
      )
    ),

    articleById: new DataLoader<ObjectId, HydratedDocument<IArticle> | null>(
      (ids) =>
        batchByIds<IArticle>(
          Article as unknown as mongoose.Model<IArticle>,
          ids
        )
    ),
  };
}
