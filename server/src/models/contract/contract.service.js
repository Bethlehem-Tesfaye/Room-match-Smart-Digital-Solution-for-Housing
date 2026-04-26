import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { User } from "../auth/schema.js";
import {
  Conversation,
  ConversationParticipant
} from "../conversation/schema.js";
import { Property } from "../property/schema.js";
import { Contract } from "./schema.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const getConversationContext = async ({ conversationId, userId }) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedUserId = toObjectId(userId, "user id");

  const conversation = await Conversation.findById(normalizedConversationId)
    .select({ listingId: 1, propertyId: 1 })
    .lean();

  if (!conversation) {
    throw new CustomError("Conversation not found", 404);
  }

  const participants = await ConversationParticipant.find({
    conversationId: normalizedConversationId
  })
    .select({ userId: 1 })
    .lean();

  if (!participants.length) {
    throw new CustomError("Conversation participants not found", 404);
  }

  const isParticipant = participants.some((participant) =>
    participant.userId.equals(normalizedUserId)
  );

  if (!isParticipant) {
    throw new CustomError(
      "You are not allowed to access this conversation",
      403
    );
  }

  const listingId = conversation.listingId || conversation.propertyId;
  if (!listingId) {
    throw new CustomError("Conversation is not linked to a listing", 400);
  }

  const listing = await Property.findOne({ _id: listingId, deletedAt: null })
    .select({
      _id: 1,
      ownerId: 1,
      title: 1,
      city: 1,
      address: 1,
      price: 1,
      currency: 1,
      status: 1
    })
    .lean();

  if (!listing?.ownerId) {
    throw new CustomError("Listing not found", 404);
  }

  const ownerObjectId = toObjectId(listing.ownerId, "listing owner id");
  const ownerInConversation = participants.some((participant) =>
    participant.userId.equals(ownerObjectId)
  );

  if (!ownerInConversation) {
    throw new CustomError("Conversation owner mismatch", 400);
  }

  const tenantParticipant = participants.find(
    (participant) => !participant.userId.equals(ownerObjectId)
  );

  if (!tenantParticipant) {
    throw new CustomError("Tenant participant not found", 404);
  }

  return {
    conversationId: normalizedConversationId,
    requesterId: normalizedUserId,
    ownerId: ownerObjectId,
    tenantId: tenantParticipant.userId,
    listingId: toObjectId(listing._id, "listing id"),
    listingStatus: listing.status
  };
};

const hydrateContract = async (contractId) => {
  return Contract.findById(contractId)
    .populate({
      path: "tenantId",
      select: "_id name email image"
    })
    .populate({
      path: "ownerId",
      select: "_id name email image"
    })
    .populate({
      path: "listingId",
      select: "_id title city address price currency ownerId"
    })
    .lean();
};

export const createRentRequest = async ({
  conversationId,
  requesterUserId
}) => {
  const context = await getConversationContext({
    conversationId,
    userId: requesterUserId
  });

  if (context.requesterId.equals(context.ownerId)) {
    throw new CustomError("Property owner cannot create rent request", 400);
  }

  if (context.listingStatus === "Rented") {
    throw new CustomError("This property is no longer available.", 409);
  }

  const existing = await Contract.findOne({
    tenantId: context.tenantId,
    listingId: context.listingId
  }).lean();

  if (existing) {
    throw new CustomError("Rent request already exists for this listing", 409);
  }

  const contract = await Contract.create({
    tenantId: context.tenantId,
    ownerId: context.ownerId,
    listingId: context.listingId,
    conversationId: context.conversationId,
    status: "PENDING"
  });

  return hydrateContract(contract._id);
};

export const getConversationRentRequest = async ({
  conversationId,
  requesterUserId
}) => {
  const context = await getConversationContext({
    conversationId,
    userId: requesterUserId
  });

  const contract = await Contract.findOne({
    tenantId: context.tenantId,
    listingId: context.listingId
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!contract) {
    return null;
  }

  return hydrateContract(contract._id);
};

const updateContractStatus = async ({
  contractId,
  ownerUserId,
  nextStatus
}) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const contract = await Contract.findOne({
    _id: normalizedContractId,
    ownerId: normalizedOwnerId
  });

  if (!contract) {
    throw new CustomError("Rent request not found", 404);
  }

  if (contract.status !== "PENDING") {
    throw new CustomError("Rent request has already been processed", 400);
  }

  contract.status = nextStatus;
  await contract.save();

  return hydrateContract(contract._id);
};

export const acceptRentRequest = async ({ contractId, ownerUserId }) => {
  return updateContractStatus({
    contractId,
    ownerUserId,
    nextStatus: "RESERVED"
  });
};

export const rejectRentRequest = async ({ contractId, ownerUserId }) => {
  return updateContractStatus({
    contractId,
    ownerUserId,
    nextStatus: "ENDED"
  });
};

export const completeContractPayment = async ({ contractId, tenantUserId }) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");

  const contract = await Contract.findOne({
    _id: normalizedContractId,
    tenantId: normalizedTenantId
  });

  if (!contract) {
    throw new CustomError("Rent request not found", 404);
  }

  if (!["RESERVED", "APPROVED"].includes(contract.status)) {
    throw new CustomError(
      "Payment is only allowed for reserved contracts",
      400
    );
  }

  const listingSnapshot = await Property.findOne({
    _id: contract.listingId,
    deletedAt: null
  })
    .select({ _id: 1, status: 1 })
    .lean();

  if (!listingSnapshot) {
    throw new CustomError("Listing not found", 404);
  }

  if (listingSnapshot.status !== "Active") {
    throw new CustomError(
      "Property is no longer available (already rented)",
      409
    );
  }

  const listing = await Property.findOneAndUpdate(
    { _id: contract.listingId, deletedAt: null, status: "Active" },
    { $set: { status: "Rented" } },
    { new: true }
  );

  if (!listing) {
    throw new CustomError(
      "Property is no longer available (already rented)",
      409
    );
  }

  contract.status = "ACTIVE";
  await contract.save();

  return hydrateContract(contract._id);
};

export const getOwnerPendingRentRequests = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  // keep only valid pending requests for active listings and existing tenant records
  const pendingContracts = await Contract.find({
    ownerId: normalizedOwnerId,
    status: "PENDING"
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "tenantId",
      model: User,
      select: "_id name email image"
    })
    .populate({
      path: "listingId",
      model: Property,
      select: "_id title city address price currency ownerId deletedAt"
    })
    .lean();

  return pendingContracts.filter(
    (contract) =>
      contract.tenantId && contract.listingId && !contract.listingId.deletedAt
  );
};

export const getTenantRentalContracts = async ({ tenantUserId }) => {
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");

  const contracts = await Contract.find({
    tenantId: normalizedTenantId,
    status: { $in: ["PENDING", "RESERVED", "ACTIVE"] }
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate({
      path: "ownerId",
      model: User,
      select: "_id name email image"
    })
    .populate({
      path: "listingId",
      model: Property,
      select: "_id title city address price currency ownerId status deletedAt"
    })
    .lean();

  return contracts.filter((contract) => {
    const listing = contract.listingId;
    const owner = contract.ownerId;

    if (!listing || !owner || listing.deletedAt) {
      return false;
    }

    const listingOwnerId =
      typeof listing.ownerId === "string"
        ? listing.ownerId
        : listing.ownerId?.toString();
    const contractOwnerId =
      typeof owner._id === "string" ? owner._id : owner._id?.toString();

    return !!listingOwnerId && listingOwnerId === contractOwnerId;
  });
};
