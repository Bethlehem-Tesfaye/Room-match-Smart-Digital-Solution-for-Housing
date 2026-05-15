/* eslint-disable prettier/prettier */
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
    deletedAt: { type: Date, default: null },

    // ========================================
    // ROOMMATE PREFERENCE FIELDS (ADDED)
    // ========================================
    cleanliness: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    sleepSchedule: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    noiseTolerance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    guests: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    studyHabits: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    temperature: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    personality: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    smoking: {
      type: String,
      enum: ["yes", "no"],
      default: "no"
    },
    pets: {
      type: String,
      enum: ["yes", "no"],
      default: "no"
    },
    // NEW HARD FILTER FIELDS
    budgetMin: { type: Number, default: 0, min: 0 },
    budgetMax: { type: Number, default: 2000, min: 0 },
    preferredLocations: { type: [String], default: [] },
    moveInDate: { type: Date, default: null },
    stayDurationMonths: { type: Number, min: 1, max: 60, default: 12 },
    drinking: { type: String, enum: ["yes", "no", "sometimes"], default: "no" },
    // NEW SOFT FILTER FIELDS
    occupation: {
      type: String,
      enum: ["student", "working", "remote", "hybrid", "unemployed"],
      default: "student"
    },
    interests: { type: [String], default: [] },
    aboutMe: { type: String, default: "", maxlength: 500 }
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
