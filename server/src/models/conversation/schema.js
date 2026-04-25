import mongoose from "mongoose";

const { Schema, model } = mongoose;

// CONVERSATION
const conversationSchema = new Schema(
  {
    participantsKey: {
      type: String,
      required: true
      // index: true
    },

    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },

    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },

    isRoommateChat: {
      type: Boolean,
      default: false
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

// CONVERSATION PARTICIPANT
const conversationParticipantSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    joinedAt: {
      type: Date,
      default: Date.now
    },

    lastReadAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

//INDEXING RULES
conversationParticipantSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true }
);

conversationSchema.index(
  { participantsKey: 1 },
  { unique: true, sparse: true }
);

export const Conversation = model("Conversation", conversationSchema);
export const ConversationParticipant = model(
  "ConversationParticipant",
  conversationParticipantSchema
);
