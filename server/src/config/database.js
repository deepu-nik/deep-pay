import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("sanitizeFilter", true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  console.log("[database] MongoDB connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
