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
      enum: [
        "PENDING",
        "RESERVED",
        "ACTIVE",
        "REJECTED",
        "CANCELLED",
        "TERMINATION_PENDING",
        "TERMINATED",
        "ENDED"
      ],
      default: "PENDING",
      index: true
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    paymentDueAt: {
      type: Date,
      default: null,
      index: true
    },
    terminationRequestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    terminationRequestedAt: {
      type: Date,
      default: null
    },
    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null, index: true },
    terminationResolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

contractSchema.index(
  { listingId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
    name: "listingId_active_unique"
  }
);

contractSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

export const Contract = model("Contract", contractSchema);
