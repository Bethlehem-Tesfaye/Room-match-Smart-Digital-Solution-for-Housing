import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const roomateProfileSchema = new Schema(
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
    profileType: {
      type: String,
      enum: ["TYPE_A", "TYPE_B"],
      required: true
      // default: "TYPE_B"
    },
    selectedPropertyId: {
      type: Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },
    currentStatus: {
      type: String,
      enum: ["Student", "Employed", "Self-employed", "Other"],
      default: "Student"
    },
    occupation: { type: String, trim: true, default: "" },
    lifestyleType: { type: String, trim: true, default: "" },
    socialLevel: { type: Number, min: 1, max: 5, default: 3 },
    cleanliness: { type: Number, min: 1, max: 5, default: 3 },
    sleepSchedule: { type: Number, min: 1, max: 5, default: 3 },
    noiseTolerance: { type: Number, min: 1, max: 5, default: 3 },
    guests: { type: Number, min: 1, max: 5, default: 3 },
    interactionLevel: { type: Number, min: 1, max: 5, default: 3 },
    responsibility: { type: Number, min: 1, max: 5, default: 3 },
    smoking: { type: String, enum: ["yes", "no"], default: "no" },
    drinking: {
      type: String,
      enum: ["yes", "no", "sometimes"],
      default: "no"
    },
    pets: { type: String, enum: ["yes", "no"], default: "no" },
    budgetMin: { type: Number, required: true, min: 0, default: 0 },
    budgetMax: { type: Number, default: null },
    desiredRoommateCount: { type: Number, min: 1, max: 10, default: 1 },
    updatedFrom: {
      type: String,
      enum: ["profile", "preferences", "matching"],
      default: "profile"
    }
  },
  {
    collection: "roommateProfile",
    timestamps: true,
    versionKey: false
  }
);

const roomatePreferencesSchema = new Schema(
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

    // preferences (Q1–Q6)
    preferredCleanliness: { type: Number, min: 1, max: 5, default: 3 },
    preferredSleepSchedule: { type: Number, min: 1, max: 5, default: 3 },
    preferredNoiseTolerance: { type: Number, min: 1, max: 5, default: 3 },
    preferredGuests: { type: Number, min: 1, max: 5, default: 3 },
    preferredSocialAtmosphere: { type: Number, min: 1, max: 5, default: 3 },
    preferredInteractionLevel: { type: Number, min: 1, max: 5, default: 3 },
    preferredResponsibility: { type: Number, min: 1, max: 5, default: 3 },

    // weights (importance of Q1–Q6)
    cleanlinessWeight: { type: Number, min: 1, max: 5, default: 3 },
    sleepWeight: { type: Number, min: 1, max: 5, default: 3 },
    noiseWeight: { type: Number, min: 1, max: 5, default: 3 },
    guestsWeight: { type: Number, min: 1, max: 5, default: 3 },
    socialWeight: { type: Number, min: 1, max: 5, default: 3 },
    interactionWeight: { type: Number, min: 1, max: 5, default: 3 },
    responsibilityWeight: { type: Number, min: 1, max: 5, default: 3 },

    // home policies (Q7)
    smokingPolicy: {
      type: String,
      enum: ["not-allowed", "allowed", "outside-only"],
      default: "not-allowed"
    },
    smokingImportance: { type: Number, min: 1, max: 5, default: 3 },

    alcoholPolicy: {
      type: String,
      enum: ["not-allowed", "occasionally", "allowed"],
      default: "occasionally"
    },
    alcoholImportance: { type: Number, min: 1, max: 5, default: 3 },

    petsPolicy: {
      type: String,
      enum: ["not-allowed", "allowed", "depends"],
      default: "not-allowed"
    },
    petsImportance: { type: Number, min: 1, max: 5, default: 3 },

    roommateType: {
      type: String,
      enum: [
        "Very similar",
        "Somewhat similar",
        "Balanced",
        "Different is fine"
      ],
      default: "Balanced"
    },

    behaviorStrictness: { type: Number, min: 1, max: 5, default: 3 },

    // hard constraints (KEEP ONLY THESE)
    acceptSmoker: { type: String, enum: ["yes", "no"], default: "no" },
    acceptPets: { type: String, enum: ["yes", "no"], default: "no" },
    acceptGuests: { type: String, enum: ["yes", "no"], default: "no" },

    minimumStayMonths: { type: Number, min: 1, max: 60, default: 1 }
  },
  {
    collection: "roommatePreferences",
    timestamps: true,
    versionKey: false
  }
);

const roomateRequestSchema = new Schema(
  {
    requesterId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },
    targetUserId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },
    roommateGroupId: {
      type: Types.ObjectId,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      index: true
    },
    requestType: {
      type: String,
      enum: ["OUTGOING", "INCOMING"],
      default: "OUTGOING"
    },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    respondedBy: { type: Schema.Types.Mixed, default: null }
  },
  {
    collection: "roommateRequest",
    timestamps: true,
    versionKey: false
  }
);

roomateRequestSchema.index({
  requesterId: 1,
  targetUserId: 1,
  propertyId: 1,
  status: 1
});

const roomateMatchSchema = new Schema(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    targetUserId: { type: Schema.Types.Mixed, required: true, index: true },
    score: { type: Number, min: 0, max: 100, required: true },
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },
    leaseEndDate: { type: Date, default: null },
    remainingDays: { type: Number, default: null },
    snapshot: { type: Schema.Types.Mixed, default: {} }
  },
  {
    collection: "roommateMatch",
    timestamps: true,
    versionKey: false
  }
);

roomateMatchSchema.index(
  { userId: 1, targetUserId: 1, propertyId: 1 },
  { unique: true }
);

const roomateConnectionSchema = new Schema(
  {
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    ownerUserId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
      validate: {
        validator(value) {
          return typeof value === "string" || value instanceof Types.ObjectId;
        },
        message: "ownerUserId must be a string or ObjectId"
      }
    },
    roommateUserId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
      validate: {
        validator(value) {
          return typeof value === "string" || value instanceof Types.ObjectId;
        },
        message: "roommateUserId must be a string or ObjectId"
      }
    }
  },
  {
    collection: "roommateConnection",
    timestamps: true,
    versionKey: false
  }
);

roomateConnectionSchema.index(
  { propertyId: 1, ownerUserId: 1, roommateUserId: 1 },
  { unique: true }
);

export const RoommateProfile =
  models.RoommateProfile || model("RoommateProfile", roomateProfileSchema);
export const RoommatePreferences =
  models.RoommatePreferences ||
  model("RoommatePreferences", roomatePreferencesSchema);
export const RoommateRequest =
  models.RoommateRequest || model("RoommateRequest", roomateRequestSchema);
export const RoommateMatch =
  models.RoommateMatch || model("RoommateMatch", roomateMatchSchema);
export const RoommateConnection =
  models.RoommateConnection ||
  model("RoommateConnection", roomateConnectionSchema);

export default {
  RoommateProfile,
  RoommatePreferences,
  RoommateRequest,
  RoommateMatch,
  RoommateConnection
};
