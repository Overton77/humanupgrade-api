import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;

export async function connectToDatabase(dbName: string): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(env.mongoUri, {
      dbName: dbName,
    });

    isConnected = true;

    if (process.env.NODE_ENV !== "production") {
      mongoose.set("debug", true);
    }

    console.log("[DB] Connected to MongoDB (db: humanupgrade)");
  } catch (error) {
    console.error("[DB] Mongo connection error:", error);
    process.exit(1);
  }
}

export function getBiohackEpisodesCollection() {
  if (!isConnected) {
    throw new Error(
      "[DB] Not connected. Call connectToDatabase() before using getBiohackEpisodesCollection."
    );
  }

  const biohackDb = mongoose.connection.useDb("biohack_agent");
  return biohackDb.collection("episodes");
}

/**
 * Get the humanupgrade database connection handle.
 * The episodes collection will be created automatically when we insert via Mongoose.
 */
export function getHumanupgradeDb() {
  if (!isConnected) {
    throw new Error(
      "[DB] Not connected. Call connectToDatabase() before using getHumanupgradeDb."
    );
  }

  return mongoose.connection.useDb("humanupgrade");
}

export function getBiohackParsedEpisodesCollection() {
  if (!isConnected) {
    throw new Error(
      "[DB] Not connected. Call connectToDatabase() before using getBiohackParsedEpisodesCollection."
    );
  }

  const biohackDb = mongoose.connection.useDb("biohack_agent");
  return biohackDb.collection("episodes_asprey_biohack_parsed");
}
