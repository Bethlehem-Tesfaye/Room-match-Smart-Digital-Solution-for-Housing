import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const scamReportSchema = new Schema(
  {
    reporterUserId: {
      type: String,
      required: true,
      index: true
    },
    reportedUserId: {
      type: String,
      required: true,
      index: true
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },
    reportType: {
      type: String,
      enum: ["listing", "user"],
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ""
    }
  },
  { timestamps: true }
);

scamReportSchema.index({ createdAt: -1 });

export const ScamReport =
  models.ScamReport || model("ScamReport", scamReportSchema);
