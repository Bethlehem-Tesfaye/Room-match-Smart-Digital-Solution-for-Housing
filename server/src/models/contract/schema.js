import mongoose from "mongoose";

const { Schema, model } = mongoose;

const contractSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "ACTIVE", "ENDED"],
      default: "PENDING",
      index: true
    }
  },
  { timestamps: true }
);

contractSchema.index({ tenantId: 1, listingId: 1 }, { unique: true });
contractSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

export const Contract = model("Contract", contractSchema);
