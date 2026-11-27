import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBySessionId: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      maxlength: 256,
      default: null,
    },
    ipAddress: {
      type: String,
      maxlength: 64,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const RefreshSession = mongoose.models.RefreshSession
  ?? mongoose.model("RefreshSession", refreshSessionSchema);
