import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    emailVerified: { type: Boolean, required: true, default: false },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" }
  },
  {
    collection: "user",
    timestamps: true,
    versionKey: false
  }
);

const accountSchema = new Schema(
  {
    accountId: { type: String, required: true, trim: true },
    providerId: { type: String, required: true, trim: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    accessToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    idToken: { type: String },
    password: { type: String },
    scope: { type: String }
  },
  {
    collection: "account",
    timestamps: true,
    versionKey: false
  }
);

accountSchema.index({ providerId: 1, accountId: 1 }, { unique: true });

const sessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    ipAddress: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    userAgent: { type: String, required: true }
  },
  {
    collection: "session",
    timestamps: true,
    versionKey: false
  }
);

const verificationSchema = new Schema(
  {
    identifier: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true }
  },
  {
    collection: "verification",
    timestamps: true,
    versionKey: false
  }
);

export const Account = models.Account || model("Account", accountSchema);
export const Session = models.Session || model("Session", sessionSchema);
export const Verification =
  models.Verification || model("Verification", verificationSchema);
export const User = models.User || model("User", userSchema);

export default {
  User,
  Account,
  Session,
  Verification
};
