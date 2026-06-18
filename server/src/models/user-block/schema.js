import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userBlockSchema = new Schema(
  {
    blockerUserId: {
      type: String,
      required: true,
      index: true
    },
    blockedUserId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

userBlockSchema.index({ blockerUserId: 1, blockedUserId: 1 }, { unique: true });

export const UserBlock =
  models.UserBlock || model("UserBlock", userBlockSchema);
