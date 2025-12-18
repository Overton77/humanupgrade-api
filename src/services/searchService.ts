import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Business } from "../models/Business.js";
import { Person } from "../models/Person.js";

import { embedText } from "./utils/embeddings.js";
import { VectorSearchArgs } from "../graphql/inputs/vectorSearchInputs.js";

export async function vectorSearchProductsByDescription({
  query,
  numCandidates,
  limit,
}: VectorSearchArgs): Promise<
  Array<{ id: string; name: string; description: string; score: number | null }>
> {
  const queryVector = await embedText(query);
  if (!queryVector) return [];

  const results: Array<{
    _id: mongoose.Types.ObjectId;
    name?: string;
    description?: string;
    score?: number;
  }> = await Product.aggregate([
    {
      $vectorSearch: {
        index: "products_descriptionEmbedding_vector",
        path: "descriptionEmbedding",
        queryVector,
        numCandidates: numCandidates ?? 100,
        limit: limit ?? 10,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).exec();

  return results.map((r) => {
    if (!r.name || !r.description) {
      throw new Error(
        `Vector search projection missing required fields for product ${r._id.toHexString()}`
      );
    }
    return {
      id: r._id.toHexString(),
      name: r.name,
      description: r.description,
      score: typeof r.score === "number" ? r.score : null,
    };
  });
}

export async function vectorSearchBusinessesByDescription({
  query,
  numCandidates,
  limit,
}: VectorSearchArgs): Promise<
  Array<{
    _id: mongoose.Types.ObjectId;
    name?: string;
    description?: string;
    score: number;
  }>
> {
  const queryVector = await embedText(query);
  if (!queryVector) return [];

  return Business.aggregate([
    {
      $vectorSearch: {
        index: "businesses_descriptionEmbedding_vector",
        path: "descriptionEmbedding",
        queryVector,
        numCandidates,
        limit,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
}

export async function vectorSearchPeopleByBio({
  query,
  numCandidates,
  limit,
}: VectorSearchArgs): Promise<
  Array<{
    _id: mongoose.Types.ObjectId;
    name?: string;
    bio?: string;
    score: number;
  }>
> {
  const queryVector = await embedText(query);
  if (!queryVector) return [];

  return Person.aggregate([
    {
      $vectorSearch: {
        index: "people_bioEmbedding_vector",
        path: "bioEmbedding",
        queryVector,
        numCandidates,
        limit,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        bio: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
}
