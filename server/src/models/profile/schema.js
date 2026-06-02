import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const userProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      unique: true,
      validate: {
        validator(value) {
          return typeof value === "string" || value instanceof Types.ObjectId;
        },
        message: "userId must be a string or ObjectId"
      }
    },
    fullName: { type: String, trim: true, maxlength: 200, default: "" },
    phoneNumber: { type: String, trim: true, maxlength: 50, default: null },
    hasCompletedOnboarding: { type: Boolean, default: false },

    bankInfo: {
      type: {
        accountName: { type: String, trim: true, default: null },
        accountNumber: { type: String, trim: true, default: null },
        bankCode: { type: String, trim: true, default: null },
        bankName: { type: String, trim: true, default: null },
        chapaSubaccountId: { type: String, trim: true, default: null }
      },
      default: null
    },
    profilePictureUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true
    },
    deletedAt: { type: Date, default: null },
    blockedReason: { type: String, trim: true, default: null }
  },
  {
    collection: "userProfile",
    timestamps: true,
    versionKey: false
  }
);

export const UserProfile =
  models.UserProfile || model("UserProfile", userProfileSchema);

export default {
  UserProfile
};
