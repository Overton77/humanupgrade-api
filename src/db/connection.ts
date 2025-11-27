import mongoose from "mongoose";
import { env } from "../config/env";

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);

    isConnected = true;

    if (process.env.NODE_ENV !== "production") {
      mongoose.set("debug", true);
    }

    console.log("[DB] Connected to MongoDB");
  } catch (error) {
    console.error("[DB] Mongo connection error:", error);
    process.exit(1);
  }
}
