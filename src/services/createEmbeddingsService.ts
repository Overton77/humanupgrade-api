import mongoose from "mongoose";
import { embedText } from "./utils/embeddings.js";
import { Product, IProduct } from "../models/Product.js";
import { Business, IBusiness } from "../models/Business.js";
import { Person, IPerson } from "../models/Person.js";

export async function embedProductDescription(
  productId: string
): Promise<IProduct | null> {
  console.log("[ctx] mongoose.db:", mongoose.connection.name);
  console.log("[ctx] product model db:", Product.db.name);
  console.log("[ctx] collection:", Product.collection.name);
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error(`Invalid productId: ${productId}`);
  }

  const product = await Product.findById(productId).select("description");
  if (!product) throw new Error("Product not found");

  const embedding = await embedText(product.description ?? "");
  if (!embedding) {
    return null;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        descriptionEmbedding: embedding,

        embeddingUpdatedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!updatedProduct) throw new Error("Failed to update product");
  return updatedProduct;
}

export async function embedBusinessDescription(
  businessId: string
): Promise<IBusiness | null> {
  const _id = new mongoose.Types.ObjectId(businessId);

  const business = await Business.findById(_id).select("description");
  if (!business) throw new Error("Business not found");

  const embedding = await embedText(business.description ?? "");
  if (!embedding) {
    return null;
  }

  const updatedBusiness = await Business.findByIdAndUpdate(
    _id,
    {
      $set: {
        descriptionEmbedding: embedding,
        embeddingUpdatedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!updatedBusiness) throw new Error("Failed to update business");
  return updatedBusiness;
}

export async function embedPersonBio(
  personId: string
): Promise<IPerson | null> {
  const _id = new mongoose.Types.ObjectId(personId);

  const person = await Person.findById(_id).select("bio");
  if (!person) throw new Error("Person not found");

  const embedding = await embedText(person.bio ?? "");
  if (!embedding) {
    return null;
  }

  const updatedPerson = await Person.findByIdAndUpdate(
    _id,
    {
      $set: {
        bioEmbedding: embedding,

        embeddingUpdatedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!updatedPerson) throw new Error("Failed to update person");
  return updatedPerson;
}
