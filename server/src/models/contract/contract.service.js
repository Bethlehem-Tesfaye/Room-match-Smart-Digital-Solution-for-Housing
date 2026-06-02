import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { User } from "../auth/schema.js";
import {
  Conversation,
  ConversationParticipant
} from "../conversation/schema.js";
import { Property } from "../property/schema.js";
import { Contract } from "./schema.js";
import * as notificationService from "../notification/notification.service.js";
import { emitToUser } from "../../config/socket.js";

const { Types } = mongoose;
const PAYMENT_WINDOW_HOURS = 72;
const PAYMENT_WINDOW_MS = PAYMENT_WINDOW_HOURS * 60 * 60 * 1000;
const TERMINATION_NOTICE_DAYS = 30;
const TERMINATION_NOTICE_MS = TERMINATION_NOTICE_DAYS * 24 * 60 * 60 * 1000;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const getPaymentDueAt = (baseDate = new Date()) => {
  return new Date(baseDate.getTime() + PAYMENT_WINDOW_MS);
};

const buildExpiredReservationQuery = (filter = {}, now = new Date()) => {
  const query = {
    status: "RESERVED",
    paymentDueAt: { $lte: now }
  };

  if (filter.contractId) {
    query._id = filter.contractId;
  }

  if (filter.listingId) {
    query.listingId = filter.listingId;
  }

  if (filter.tenantId) {
    query.tenantId = filter.tenantId;
  }

  if (filter.ownerId) {
    query.ownerId = filter.ownerId;
  }

  return query;
};

const releaseExpiredReservations = async (filter = {}) => {
  const now = new Date();
  const expiredContracts = await Contract.find(
    buildExpiredReservationQuery(filter, now)
  )
    .select({ _id: 1, listingId: 1 })
    .lean();

  if (!expiredContracts.length) {
    return 0;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let releasedCount = 0;

    for (const contract of expiredContracts) {
      const deletedContract = await Contract.findOneAndDelete(
        buildExpiredReservationQuery({ contractId: contract._id }, now),
        { session }
      );

      if (!deletedContract) {
        continue;
      }

      await Property.updateOne(
        { _id: deletedContract.listingId, deletedAt: null },
        { $set: { status: "Active" } },
        { session }
      );

      releasedCount += 1;
    }

    await session.commitTransaction();

    return releasedCount;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const ensureReservationIsCurrent = async (contractId) => {
  await releaseExpiredReservations({ contractId });
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

const loadHydratedContract = async (contractId) => {
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
      path: "terminationRequestedBy",
      select: "_id name email image"
    })
    .populate({
      path: "listingId",
      select: "_id title city address price currency ownerId status"
    })
    .lean();
};

const completeTerminationNotice = async (contract, session = null) => {
  if (!contract) {
    throw new CustomError("Rent request not found", 404);
  }

  if (contract.status !== "TERMINATION_PENDING") {
    return contract;
  }

  const listing = await Property.findOneAndUpdate(
    {
      _id: contract.listingId,
      deletedAt: null
    },
    {
      $set: { status: "Active" }
    },
    { new: true, session }
  );

  if (!listing) {
    throw new CustomError("Listing not found", 404);
  }

  contract.status = "TERMINATED";
  contract.terminationResolvedAt = new Date();
  await contract.save({ session });

  return contract;
};

const maybeAutoTerminateNotice = async (contract) => {
  if (!contract || contract.status !== "TERMINATION_PENDING") {
    return contract;
  }

  if (!contract.terminationEffectiveDate) {
    return contract;
  }

  const terminationEffectiveDate = new Date(contract.terminationEffectiveDate);
  if (Date.now() < terminationEffectiveDate.getTime()) {
    return contract;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const latestContract = await Contract.findById(contract._id).session(
      session
    );

    if (!latestContract) {
      await session.abortTransaction();
      return null;
    }

    if (
      latestContract.status !== "TERMINATION_PENDING" ||
      !latestContract.terminationEffectiveDate ||
      Date.now() < new Date(latestContract.terminationEffectiveDate).getTime()
    ) {
      await session.abortTransaction();
      return loadHydratedContract(contract._id);
    }

    await completeTerminationNotice(latestContract, session);

    await session.commitTransaction();

    return loadHydratedContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const hydrateContract = async (contractId) => {
  const contract = await loadHydratedContract(contractId);

  return maybeAutoTerminateNotice(contract);
};

const ownerUnreadTerminationFilter = (normalizedOwnerId) => ({
  ownerId: normalizedOwnerId,
  status: "TERMINATION_PENDING",
  terminationRequestedBy: { $nin: [null, normalizedOwnerId] },
  terminationRequestedAt: { $ne: null },
  $or: [
    { ownerTerminationViewedAt: null },
    {
      $expr: {
        $lt: ["$ownerTerminationViewedAt", "$terminationRequestedAt"]
      }
    }
  ]
});

export const getOwnerRentalUnreadCounts = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const [incomingUnreadCount, terminationUnreadCount] = await Promise.all([
    Contract.countDocuments({
      ownerId: normalizedOwnerId,
      status: "PENDING",
      ownerIncomingViewedAt: null
    }),
    Contract.countDocuments(ownerUnreadTerminationFilter(normalizedOwnerId))
  ]);

  return {
    incomingUnreadCount,
    terminationUnreadCount,
    totalUnreadCount: incomingUnreadCount + terminationUnreadCount
  };
};

export const markOwnerIncomingAsRead = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const result = await Contract.updateMany(
    {
      ownerId: normalizedOwnerId,
      status: "PENDING",
      ownerIncomingViewedAt: null
    },
    { $set: { ownerIncomingViewedAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

export const markOwnerTerminationAsRead = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const result = await Contract.updateMany(
    ownerUnreadTerminationFilter(normalizedOwnerId),
    { $set: { ownerTerminationViewedAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

export const emitOwnerRentalUnreadUpdate = async (ownerUserId) => {
  const ownerId = String(ownerUserId);
  const counts = await getOwnerRentalUnreadCounts({ ownerUserId: ownerId });
  emitToUser(ownerId, "rental:unread-update", counts);
  return counts;
};

const tenantUnreadRequestedFilter = (normalizedTenantId, now = new Date()) => ({
  tenantId: normalizedTenantId,
  status: "RESERVED",
  paymentDueAt: { $gt: now },
  acceptedAt: { $ne: null },
  $or: [
    { tenantRequestedViewedAt: null },
    {
      $expr: {
        $lt: ["$tenantRequestedViewedAt", "$acceptedAt"]
      }
    }
  ]
});

const tenantUnreadTerminationFilter = (normalizedTenantId) => ({
  tenantId: normalizedTenantId,
  status: "TERMINATION_PENDING",
  terminationRequestedBy: { $nin: [null, normalizedTenantId] },
  terminationRequestedAt: { $ne: null },
  $or: [
    { tenantTerminationViewedAt: null },
    {
      $expr: {
        $lt: ["$tenantTerminationViewedAt", "$terminationRequestedAt"]
      }
    }
  ]
});

export const getTenantRentalUnreadCounts = async ({ tenantUserId }) => {
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");
  const now = new Date();

  const [requestedUnreadCount, terminationUnreadCount] = await Promise.all([
    Contract.countDocuments(
      tenantUnreadRequestedFilter(normalizedTenantId, now)
    ),
    Contract.countDocuments(tenantUnreadTerminationFilter(normalizedTenantId))
  ]);

  return {
    requestedUnreadCount,
    terminationUnreadCount,
    totalUnreadCount: requestedUnreadCount + terminationUnreadCount
  };
};

export const markTenantRequestedAsRead = async ({ tenantUserId }) => {
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");
  const now = new Date();

  const result = await Contract.updateMany(
    tenantUnreadRequestedFilter(normalizedTenantId, now),
    { $set: { tenantRequestedViewedAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

export const markTenantTerminationAsRead = async ({ tenantUserId }) => {
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");

  const result = await Contract.updateMany(
    tenantUnreadTerminationFilter(normalizedTenantId),
    { $set: { tenantTerminationViewedAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

export const emitTenantRentalUnreadUpdate = async (tenantUserId) => {
  const tenantId = String(tenantUserId);
  const counts = await getTenantRentalUnreadCounts({ tenantUserId: tenantId });
  emitToUser(tenantId, "tenant-rental:unread-update", counts);
  return counts;
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

  await releaseExpiredReservations({ listingId: context.listingId });

  const listing = await Property.findOne({
    _id: context.listingId,
    deletedAt: null
  })
    .select({ _id: 1, status: 1, ownerId: 1 })
    .lean();

  if (!listing) {
    throw new CustomError("Listing not found", 404);
  }

  if (listing.status !== "Active") {
    throw new CustomError("This property is no longer available.", 409);
  }

  const existing = await Contract.findOne({
    tenantId: context.tenantId,
    listingId: context.listingId
  })
    .where("status")
    .in(["PENDING", "RESERVED", "ACTIVE", "TERMINATION_PENDING"])
    .lean();

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

  void emitOwnerRentalUnreadUpdate(context.ownerId).catch(() => undefined);

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

  await releaseExpiredReservations({ listingId: context.listingId });

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

export const createTerminationNotice = async ({
  contractId,
  requesterUserId
}) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedRequesterId = toObjectId(requesterUserId, "user id");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract =
      await Contract.findById(normalizedContractId).session(session);

    if (!contract) {
      throw new CustomError("Rent request not found", 404);
    }

    if (!contract.status || contract.status !== "ACTIVE") {
      throw new CustomError(
        "Termination notices are only allowed after payment",
        400
      );
    }

    const isOwner = contract.ownerId.equals(normalizedRequesterId);
    const isTenant = contract.tenantId.equals(normalizedRequesterId);

    if (!isOwner && !isTenant) {
      throw new CustomError(
        "You are not allowed to request termination for this contract",
        403
      );
    }

    if (
      contract.terminationRequestedAt ||
      contract.status === "TERMINATION_PENDING"
    ) {
      throw new CustomError("Termination notice already exists", 409);
    }

    contract.status = "TERMINATION_PENDING";
    contract.terminationRequestedBy = normalizedRequesterId;
    contract.terminationRequestedAt = new Date();
    contract.terminationEffectiveDate = new Date(
      Date.now() + TERMINATION_NOTICE_MS
    );

    // New notice must appear unread for the other party.
    if (!contract.ownerId.equals(normalizedRequesterId)) {
      contract.ownerTerminationViewedAt = null;
    } else {
      contract.tenantTerminationViewedAt = null;
    }

    await contract.save({ session });

    await session.commitTransaction();

    const accepterId = contract.ownerId.equals(normalizedRequesterId)
      ? contract.tenantId
      : contract.ownerId;

    // Notify the other party that a termination was requested.
    try {
      const notification = await notificationService.createNotification({
        userId: accepterId,
        type: "ListingUpdate",
        title: "Termination notice created",
        content:
          "A termination notice was created for this contract. The rental will automatically terminate when the notice period ends unless the initiator withdraws it first.",
        relatedEntityId: contract._id
      });

      emitToUser(accepterId, "notification:receive", notification);
    } catch (notifyErr) {
      // swallowing notification errors to avoid failing the main flow
    }

    if (!contract.ownerId.equals(normalizedRequesterId)) {
      void emitOwnerRentalUnreadUpdate(contract.ownerId).catch(() => undefined);
    } else {
      void emitTenantRentalUnreadUpdate(contract.tenantId).catch(
        () => undefined
      );
    }

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const withdrawTerminationNotice = async ({
  contractId,
  requesterUserId
}) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedRequesterId = toObjectId(requesterUserId, "user id");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract =
      await Contract.findById(normalizedContractId).session(session);

    if (!contract) {
      throw new CustomError("Rent request not found", 404);
    }

    if (contract.status !== "TERMINATION_PENDING") {
      throw new CustomError("No termination notice is active", 400);
    }

    if (!contract.terminationRequestedBy?.equals(normalizedRequesterId)) {
      throw new CustomError("Only the initiator can withdraw this notice", 403);
    }

    contract.status = "ACTIVE";
    contract.terminationRequestedBy = null;
    contract.terminationRequestedAt = null;
    contract.terminationEffectiveDate = null;
    contract.terminationResolvedAt = new Date();
    await contract.save({ session });

    await session.commitTransaction();

    void emitOwnerRentalUnreadUpdate(contract.ownerId).catch(() => undefined);
    void emitTenantRentalUnreadUpdate(contract.tenantId).catch(() => undefined);

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const sweepExpiredTerminationNotices = async () => {
  const now = new Date();

  const expiredNotices = await Contract.find({
    status: "TERMINATION_PENDING",
    terminationEffectiveDate: { $lte: now }
  }).select({ _id: 1 });

  if (!expiredNotices.length) {
    return 0;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let processed = 0;

    for (const notice of expiredNotices) {
      const contract = await Contract.findById(notice._id).session(session);

      if (!contract || contract.status !== "TERMINATION_PENDING") {
        continue;
      }

      if (!contract.terminationEffectiveDate) {
        continue;
      }

      if (Date.now() < new Date(contract.terminationEffectiveDate).getTime()) {
        continue;
      }

      await completeTerminationNotice(contract, session);
      processed += 1;
    }

    await session.commitTransaction();
    return processed;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const acceptRentRequest = async ({ contractId, ownerUserId }) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const contractPreview = await Contract.findOne({
    _id: normalizedContractId,
    ownerId: normalizedOwnerId
  }).lean();

  if (!contractPreview) {
    throw new CustomError("Rent request not found", 404);
  }

  if (contractPreview.status !== "PENDING") {
    throw new CustomError("Rent request has already been processed", 400);
  }

  await releaseExpiredReservations({ listingId: contractPreview.listingId });

  const existingAccepted = await Contract.findOne({
    listingId: contractPreview.listingId,
    status: { $in: ["RESERVED", "ACTIVE", "TERMINATION_PENDING"] }
  })
    .select({ _id: 1 })
    .lean();

  if (existingAccepted) {
    throw new CustomError(
      "You have already accepted rent request for this property. Property reserved.",
      409
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract = await Contract.findOne({
      _id: normalizedContractId,
      ownerId: normalizedOwnerId,
      status: "PENDING"
    }).session(session);

    if (!contract) {
      throw new CustomError("Rent request has already been processed", 400);
    }

    const listing = await Property.findOneAndUpdate(
      {
        _id: contract.listingId,
        deletedAt: null,
        status: "Active"
      },
      {
        $set: {
          status: "Reserved"
        }
      },
      { new: true, session }
    );

    if (!listing) {
      throw new CustomError("This property is no longer available.", 409);
    }

    contract.status = "RESERVED";
    contract.acceptedAt = new Date();
    contract.paymentDueAt = getPaymentDueAt(contract.acceptedAt);
    contract.tenantRequestedViewedAt = null;
    await contract.save({ session });

    await session.commitTransaction();

    void emitOwnerRentalUnreadUpdate(normalizedOwnerId).catch(() => undefined);
    void emitTenantRentalUnreadUpdate(contract.tenantId).catch(() => undefined);

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const rejectRentRequest = async ({ contractId, ownerUserId }) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract = await Contract.findOne({
      _id: normalizedContractId,
      ownerId: normalizedOwnerId
    }).session(session);

    if (!contract) {
      throw new CustomError("Rent request not found", 404);
    }

    if (contract.status !== "PENDING") {
      throw new CustomError("Rent request has already been processed", 400);
    }

    contract.status = "REJECTED";
    await contract.save({ session });

    await session.commitTransaction();

    void emitOwnerRentalUnreadUpdate(normalizedOwnerId).catch(() => undefined);

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const cancelRentRequest = async ({ contractId, requesterUserId }) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedRequesterId = toObjectId(requesterUserId, "user id");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract =
      await Contract.findById(normalizedContractId).session(session);

    if (!contract) {
      throw new CustomError("Rent request not found", 404);
    }

    const isOwner = contract.ownerId.equals(normalizedRequesterId);
    const isTenant = contract.tenantId.equals(normalizedRequesterId);

    if (!isOwner && !isTenant) {
      throw new CustomError(
        "You are not allowed to delete this rent request",
        403
      );
    }

    const wasPending = contract.status === "PENDING";

    if (
      contract.status === "ACTIVE" ||
      contract.status === "TERMINATION_PENDING" ||
      contract.status === "TERMINATED"
    ) {
      throw new CustomError("Processed contracts cannot be deleted", 400);
    }

    if (contract.status === "RESERVED") {
      await Property.updateOne(
        { _id: contract.listingId, deletedAt: null },
        { $set: { status: "Active" } },
        { session }
      );
    }

    contract.status = "CANCELLED";
    await contract.save({ session });

    await session.commitTransaction();

    if (wasPending) {
      void emitOwnerRentalUnreadUpdate(contract.ownerId).catch(() => undefined);
    }

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const completeContractPayment = async ({ contractId, tenantUserId }) => {
  const normalizedContractId = toObjectId(contractId, "contract id");
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");

  const contractPreview = await Contract.findOne({
    _id: normalizedContractId,
    tenantId: normalizedTenantId
  }).lean();

  if (!contractPreview) {
    throw new CustomError("Rent request not found", 404);
  }

  if (contractPreview.status !== "RESERVED") {
    throw new CustomError(
      "Payment is only allowed for reserved contracts",
      400
    );
  }

  const now = new Date();

  if (
    contractPreview.paymentDueAt &&
    new Date(contractPreview.paymentDueAt).getTime() <= now.getTime()
  ) {
    await releaseExpiredReservations({ contractId: normalizedContractId });

    throw new CustomError("Payment window has expired", 410);
  }

  await ensureReservationIsCurrent(normalizedContractId);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const contract = await Contract.findOne({
      _id: normalizedContractId,
      tenantId: normalizedTenantId,
      status: "RESERVED"
    }).session(session);

    if (!contract) {
      throw new CustomError("Rent request not found", 404);
    }

    if (
      contract.paymentDueAt &&
      new Date(contract.paymentDueAt).getTime() <= now.getTime()
    ) {
      throw new CustomError("Payment window has expired", 410);
    }

    const listing = await Property.findOneAndUpdate(
      {
        _id: contract.listingId,
        deletedAt: null,
        status: "Reserved"
      },
      {
        $set: {
          status: "Rented"
        }
      },
      { new: true, session }
    );

    if (!listing) {
      throw new CustomError(
        "Property is no longer available (already rented)",
        409
      );
    }

    // set active contract with lease dates based on property's leasePeriod
    contract.status = "ACTIVE";
    const leaseStartAt = new Date();
    contract.startDate = leaseStartAt;
    const leaseMonths = Number(listing.leasePeriod || 0);
    const endDate = new Date(leaseStartAt);
    if (leaseMonths > 0) {
      endDate.setMonth(endDate.getMonth() + leaseMonths);
      contract.endDate = endDate;
    } else {
      contract.endDate = null;
    }

    await contract.save({ session });

    await session.commitTransaction();

    void emitTenantRentalUnreadUpdate(contract.tenantId).catch(() => undefined);

    return hydrateContract(contract._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const purgeExpiredLeases = async () => {
  const now = new Date();

  const expiredContracts = await Contract.find({
    status: "ACTIVE",
    endDate: { $lte: now }
  }).select({ _id: 1, listingId: 1 });

  if (!expiredContracts.length) return 0;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let processed = 0;

    for (const contractDoc of expiredContracts) {
      const contract = await Contract.findById(contractDoc._id).session(
        session
      );

      if (!contract || contract.status !== "ACTIVE") continue;

      // mark contract terminated and free up property
      contract.status = "TERMINATED";
      contract.terminationResolvedAt = new Date();
      await contract.save({ session });

      await Property.updateOne(
        { _id: contract.listingId, deletedAt: null },
        { $set: { status: "Active" } },
        { session }
      );

      processed += 1;
    }

    await session.commitTransaction();
    return processed;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
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

export const getOwnerAcceptedRentRequests = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  await releaseExpiredReservations({ ownerId: normalizedOwnerId });

  const acceptedContracts = await Contract.find({
    ownerId: normalizedOwnerId,
    status: "RESERVED"
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

  return acceptedContracts.filter(
    (contract) =>
      contract.tenantId &&
      contract.listingId &&
      !contract.listingId.deletedAt &&
      contract.paymentDueAt &&
      new Date(contract.paymentDueAt).getTime() > Date.now()
  );
};

export const getOwnerActiveRentRequests = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const activeContracts = await Contract.find({
    ownerId: normalizedOwnerId,
    status: { $in: ["ACTIVE", "TERMINATION_PENDING"] }
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "tenantId",
      model: User,
      select: "_id name email image"
    })
    .populate({
      path: "terminationRequestedBy",
      model: User,
      select: "_id name email image"
    })
    .populate({
      path: "listingId",
      model: Property,
      select: "_id title city address price currency ownerId deletedAt status"
    })
    .lean();

  const hydratedActiveContracts = await Promise.all(
    activeContracts.map((contract) => maybeAutoTerminateNotice(contract))
  );

  return hydratedActiveContracts
    .filter(Boolean)
    .filter(
      (contract) =>
        contract.tenantId && contract.listingId && !contract.listingId.deletedAt
    );
};

export const getOwnerTerminationRequests = async ({ ownerUserId }) => {
  const normalizedOwnerId = toObjectId(ownerUserId, "owner user id");

  const terminationContracts = await Contract.find({
    ownerId: normalizedOwnerId,
    status: "TERMINATION_PENDING"
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
      select: "_id title city address price currency ownerId deletedAt status"
    })
    .populate({
      path: "terminationRequestedBy",
      model: User,
      select: "_id name email image"
    })
    .lean();

  const hydratedTerminationContracts = await Promise.all(
    terminationContracts.map((contract) => maybeAutoTerminateNotice(contract))
  );

  return hydratedTerminationContracts
    .filter(Boolean)
    .filter(
      (contract) =>
        contract.tenantId && contract.listingId && !contract.listingId.deletedAt
    );
};

export const getTenantRentalContracts = async ({ tenantUserId }) => {
  const normalizedTenantId = toObjectId(tenantUserId, "tenant user id");

  await releaseExpiredReservations({ tenantId: normalizedTenantId });

  const contracts = await Contract.find({
    tenantId: normalizedTenantId,
    status: {
      $in: [
        "PENDING",
        "RESERVED",
        "ACTIVE",
        "REJECTED",
        "CANCELLED",
        "TERMINATION_PENDING",
        "TERMINATED"
      ]
    }
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
      select:
        "_id title city address price currency ownerId status deletedAt allowRoommates"
    })
    .populate({
      path: "terminationRequestedBy",
      model: User,
      select: "_id name email image"
    })
    .lean();

  const hydratedContracts = await Promise.all(
    contracts.map((contract) => maybeAutoTerminateNotice(contract))
  );

  return hydratedContracts.filter(Boolean).filter((contract) => {
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

export const purgeExpiredReservations = async () => {
  return releaseExpiredReservations();
};
