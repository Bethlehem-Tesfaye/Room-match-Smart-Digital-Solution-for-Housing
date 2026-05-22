import CustomError from "../../lib/errors.js";
import { RoommateRequest, RoommateProfile } from "./schema.js";
import { User } from "../auth/schema.js";
import { UserProfile } from "../profile/schema.js";

// helper
const getOppositeType = (type) => (type === "TYPE_A" ? "TYPE_B" : "TYPE_A");

export const createRoommateRequestService = async ({
  requesterId,
  targetUserId,
  propertyId
}) => {
  if (!targetUserId) {
    throw new CustomError("targetUserId is required", 400);
  }

  if (String(targetUserId) === String(requesterId)) {
    throw new CustomError("You cannot request yourself", 400);
  }

  const [requesterProfile, targetProfile] = await Promise.all([
    RoommateProfile.findOne({ userId: requesterId }).lean(),
    RoommateProfile.findOne({ userId: targetUserId }).lean()
  ]);

  if (!requesterProfile || !targetProfile) {
    throw new CustomError("Roommate profile not found", 404);
  }

  if (requesterProfile.profileType === targetProfile.profileType) {
    throw new CustomError(
      "Requests allowed only between TYPE_A and TYPE_B",
      400
    );
  }

  const existing = await RoommateRequest.findOne({
    requesterId,
    targetUserId,
    propertyId: propertyId || null,
    status: { $in: ["PENDING", "ACCEPTED"] }
  }).lean();

  if (existing) {
    throw new CustomError("A roommate request already exists", 409);
  }

  const request = await RoommateRequest.create({
    requesterId,
    targetUserId,
    propertyId: propertyId || null,
    roommateGroupId: propertyId || null,
    status: "PENDING",
    requestType: "OUTGOING"
  });

  return request;
};

export const getRoommateRequestsService = async (userId) => {
  const [incoming, outgoing] = await Promise.all([
    RoommateRequest.find({ targetUserId: userId })
      .sort({ createdAt: -1 })
      .lean(),
    RoommateRequest.find({ requesterId: userId }).sort({ createdAt: -1 }).lean()
  ]);

  const userIds = [
    ...new Set(
      [...incoming, ...outgoing].flatMap((r) => [r.requesterId, r.targetUserId])
    )
  ];

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id name email image")
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const attach = (r) => ({
    ...r,
    requester: userMap.get(String(r.requesterId)) || null,
    target: userMap.get(String(r.targetUserId)) || null
  });

  return {
    incoming: incoming.map(attach),
    outgoing: outgoing.map(attach)
  };
};

export const acceptRoommateRequestService = async ({ requestId, userId }) => {
  const request = await RoommateRequest.findOne({
    _id: requestId,
    targetUserId: userId,
    status: "PENDING"
  });

  if (!request) {
    throw new CustomError("Request not found", 404);
  }

  const [requesterProfile, targetProfile] = await Promise.all([
    RoommateProfile.findOne({ userId: request.requesterId }),
    RoommateProfile.findOne({ userId: request.targetUserId })
  ]);

  if (!requesterProfile || !targetProfile) {
    throw new CustomError("Profiles missing", 400);
  }

  // TYPE_B joins TYPE_A property (your rule)
  const addedUserId =
    requesterProfile.profileType === "TYPE_B"
      ? request.requesterId
      : request.targetUserId;

  await RoommateProfile.findOneAndUpdate(
    { userId: addedUserId },
    {
      $set: {
        selectedPropertyId: request.propertyId
      }
    }
  );

  request.status = "ACCEPTED";
  request.acceptedAt = new Date();
  request.respondedBy = userId;

  await request.save();

  return request;
};

export const rejectRoommateRequestService = async ({ requestId, userId }) => {
  const request = await RoommateRequest.findOne({
    _id: requestId,
    targetUserId: userId,
    status: "PENDING"
  });

  if (!request) {
    throw new CustomError("Request not found", 404);
  }

  request.status = "REJECTED";
  request.rejectedAt = new Date();
  request.respondedBy = userId;

  await request.save();

  return request;
};
