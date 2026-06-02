import mongoose from "mongoose";

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["Message", "Match", "Payment", "ListingUpdate"],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
