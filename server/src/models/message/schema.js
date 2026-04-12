import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    messageType: {
      type: String,
      enum: ["Text", "Image", "Document"],
      default: "Text"
    }
  },
  { timestamps: true }
);

// index for chat loading performance

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model("Message", messageSchema);
