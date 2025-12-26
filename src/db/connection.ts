import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { Errors } from "../lib/errors.js";

let connectingPromise: Promise<typeof mongoose> | null = null;
let listenersRegistered = false;

function ensureListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("connected", () => {
    logger.info("[DB] Mongoose connected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.warn("[DB] Mongoose reconnected");
  });

  mongoose.connection.on("disconnected", () => {
    logger.error("[DB] Mongoose disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("[DB] Mongoose connection error", err);
  });
}

function assertConnected() {
  // 1 = connected
  if (mongoose.connection.readyState !== 1) {
    throw Errors.databaseError(
      "[DB] Not connected. Call connectToDatabase() before using DB helpers."
    );
  }
}

export async function connectToDatabase(dbName: string): Promise<void> {
  ensureListeners();

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) return;

  if (!connectingPromise) {
    connectingPromise = mongoose.connect(env.mongoUri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45_000,
    });
  }

  try {
    await connectingPromise;

    if (process.env.NODE_ENV !== "production") {
      mongoose.set("debug", true);
    }

    logger.info(`[DB] Connected to MongoDB (db: ${dbName})`);
  } catch (err) {
    connectingPromise = null;
    logger.error("[DB] MongoDB connection failed", err);
    throw Errors.databaseError("Failed to connect to MongoDB", err);
  }
}

/**
 * Returns a cached mongoose.Connection for a specific DB name.
 * Note: this does NOT open a new network connection; it's the same underlying pool.
 */
export function getDb(dbName: string): mongoose.Connection {
  assertConnected();
  return mongoose.connection.useDb(dbName, { useCache: true });
}

export function getCollection<TSchema extends mongoose.mongo.Document = any>(
  dbName: string,
  collectionName: string
): mongoose.mongo.Collection<TSchema> {
  const db = getDb(dbName);
  return db.collection<TSchema>(collectionName);
}

export function getBiohackEpisodesCollection() {
  return getCollection("biohack_agent", "episodes");
}

export function getHumanupgradeDb() {
  return getDb("humanupgrade");
}

export function getBiohackParsedEpisodesCollection() {
  return getCollection("biohack_agent", "episodes_asprey_biohack_parsed");
}
