import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const paymentSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true
    },
    tenantId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    txRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    ownerAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB", trim: true, maxlength: 10 },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true
    },
    chapaCheckoutUrl: { type: String, default: null }
  },
  {
    collection: "payment",
    timestamps: true,
    versionKey: false
  }
);

paymentSchema.index({ txRef: 1 }, { unique: true });

export const Payment = models.Payment || model("Payment", paymentSchema);

export default {
  Payment
};
