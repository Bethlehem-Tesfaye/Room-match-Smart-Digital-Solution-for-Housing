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
    profilePictureUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true
    },
    deletedAt: { type: Date, default: null }
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
