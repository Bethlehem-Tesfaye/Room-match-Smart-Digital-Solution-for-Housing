import {
  RoommateProfile,
  RoommatePreferences,
  RoommateMatch
} from "./schema.js";
import { UserProfile } from "../profile/schema.js";
import { Property } from "../property/schema.js";
import { Contract } from "../contract/schema.js";
import { calculateRoommateMatch } from "./roommateMatcher.js";
import CustomError from "../../lib/errors.js";

const getOppositeType = (type) => (type === "TYPE_A" ? "TYPE_B" : "TYPE_A");
const toUserIdString = (id) => (id ? id.toString() : "");
const DAY_MS = 24 * 60 * 60 * 1000;

export const clearMatchesForUser = async (userId) => {
  return RoommateMatch.deleteMany({
    $or: [{ userId }, { targetUserId: userId }]
  });
};

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const buildLeaseInfo = ({ contract, property }) => {
  if (!contract?.createdAt || !property?.leasePeriod) return null;

  const contractCreatedAt = new Date(contract.createdAt);
  if (Number.isNaN(contractCreatedAt.getTime())) return null;

  const leaseEndDate = addMonths(contractCreatedAt, property.leasePeriod);
  const remainingDays = Math.max(
    0,
    Math.ceil((leaseEndDate.getTime() - Date.now()) / DAY_MS)
  );

  return {
    leaseEndDate: leaseEndDate.toISOString(),
    remainingDays
  };
};

const validateTypeAEligibility = async (currentProfile) => {
  if (currentProfile?.profileType !== "TYPE_A") return null;

  const propertyId = currentProfile.selectedPropertyId ?? null;
  if (!propertyId) {
    throw new CustomError(
      "This property does not allow roommate matching",
      400
    );
  }

  const activeContract = await Contract.findOne({
    tenantId: currentProfile.userId,
    status: "ACTIVE",
    listingId: propertyId
  })
    .populate({ path: "listingId", select: { _id: 1, allowRoommates: 1 } })
    .lean();

  const activeListing = activeContract?.listingId;

  if (!activeListing || typeof activeListing === "string") {
    throw new CustomError(
      "This property does not allow roommate matching",
      400
    );
  }

  if (!activeListing.allowRoommates) {
    throw new CustomError(
      "This property does not allow roommate matching",
      400
    );
  }

  return activeListing;
};

export const generateMatchesForUser = async (userId) => {
  const currentProfile = await RoommateProfile.findOne({ userId }).lean();
  const preferences = await RoommatePreferences.findOne({ userId }).lean();

  if (!currentProfile || !preferences) {
    throw new Error("Profile or preferences missing");
  }

  await validateTypeAEligibility(currentProfile);

  const currentUserIdStr = toUserIdString(userId);

  const candidateProfiles = await RoommateProfile.find({
    profileType: getOppositeType(currentProfile.profileType)
  }).lean();

  const candidateUserIds = candidateProfiles
    .map((p) => p.userId)
    .filter((id) => toUserIdString(id) !== currentUserIdStr);

  // Fetch full preference docs instead of just userId
  const candidatePreferenceDocs = await RoommatePreferences.find({
    userId: { $in: candidateUserIds }
  }).lean();

  // Build a map of userId -> full preferences
  const candidatePreferencesMap = {};
  for (const pref of candidatePreferenceDocs) {
    candidatePreferencesMap[toUserIdString(pref.userId)] = pref;
  }

  const qualifiedCandidates = candidateProfiles.filter(
    (p) =>
      toUserIdString(p.userId) !== currentUserIdStr &&
      candidatePreferencesMap[toUserIdString(p.userId)]
  );

  const propertyId = currentProfile.selectedPropertyId ?? null;
  const results = [];

  for (const targetProfile of qualifiedCandidates) {
    const targetPreferences =
      candidatePreferencesMap[toUserIdString(targetProfile.userId)];

    // Calculate both directions
    const scoreAtoB = calculateRoommateMatch({
      currentProfile,
      targetProfile,
      preferences
    });

    const scoreBtoA = calculateRoommateMatch({
      currentProfile: targetProfile,
      targetProfile: currentProfile,
      preferences: targetPreferences
    });

    // If either side is a hard 0, skip the match entirely
    if (scoreAtoB <= 0 || scoreBtoA <= 0) continue;

    // Average both scores
    const mutualScore = Math.round(((scoreAtoB + scoreBtoA) / 2) * 100) / 100;

    const targetPropertyId = targetProfile.selectedPropertyId ?? null;

    try {
      // A -> B match
      const match = await RoommateMatch.findOneAndUpdate(
        { userId, targetUserId: targetProfile.userId, propertyId },
        {
          $set: {
            userId,
            targetUserId: targetProfile.userId,
            propertyId,
            score: mutualScore,
            snapshot: {
              targetProfile,
              scoreAtoB,
              scoreBtoA,
              generatedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );

      results.push(match);

      // upsert the reverse match so B sees it too
      await RoommateMatch.findOneAndUpdate(
        {
          userId: targetProfile.userId,
          targetUserId: userId,
          propertyId: targetPropertyId
        },
        {
          $set: {
            userId: targetProfile.userId,
            targetUserId: userId,
            propertyId: targetPropertyId,
            score: mutualScore,
            snapshot: {
              targetProfile: currentProfile,
              scoreAtoB: scoreBtoA,
              scoreBtoA: scoreAtoB,
              generatedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
  }

  return results;
};

// getMatchesForUser stays exactly the same
export const getMatchesForUser = async (userId) => {
  const currentProfile = await RoommateProfile.findOne({ userId }).lean();
  const currentPropertyId = currentProfile?.selectedPropertyId ?? null;

  const matches = await RoommateMatch.find({
    userId,
    propertyId: currentPropertyId
  })
    .sort({ score: -1 })
    .lean();

  const targetUserIds = [
    ...new Set(matches.map((m) => m.targetUserId?.toString()).filter(Boolean))
  ];

  const userProfiles = await UserProfile.find({
    userId: { $in: targetUserIds }
  }).lean();

  const roommateProfiles = await RoommateProfile.find({
    userId: { $in: targetUserIds }
  }).lean();

  const profileMap = {};
  for (const profile of userProfiles) {
    profileMap[profile.userId.toString()] = profile;
  }

  const roommateProfileMap = {};
  for (const rp of roommateProfiles) {
    roommateProfileMap[rp.userId.toString()] = rp;
  }

  const resolvedPropertyIds = [
    ...new Set(
      matches
        .map((match) => {
          const targetIdStr = match.targetUserId?.toString();
          const targetRoommateProfile = roommateProfileMap[targetIdStr] || null;

          return (
            match.propertyId ||
            targetRoommateProfile?.selectedPropertyId ||
            match.snapshot?.targetProfile?.selectedPropertyId ||
            null
          );
        })
        .filter(Boolean)
        .map((propertyId) => propertyId.toString())
    )
  ];

  const [properties, activeContracts] = await Promise.all([
    resolvedPropertyIds.length
      ? Property.find({ _id: { $in: resolvedPropertyIds } })
          .select({ _id: 1, leasePeriod: 1 })
          .lean()
      : Promise.resolve([]),
    resolvedPropertyIds.length
      ? Contract.find({
          listingId: { $in: resolvedPropertyIds },
          status: "ACTIVE"
        })
          .select({ _id: 1, listingId: 1, createdAt: 1 })
          .lean()
      : Promise.resolve([])
  ]);

  const propertyMap = {};
  for (const property of properties) {
    propertyMap[property._id.toString()] = property;
  }

  const activeContractMap = {};
  for (const contract of activeContracts) {
    activeContractMap[contract.listingId.toString()] = contract;
  }

  return matches.map((match) => {
    const targetIdStr = match.targetUserId?.toString();
    const targetRoommateProfile = roommateProfileMap[targetIdStr] || null;
    const resolvedPropertyId =
      match.propertyId ||
      targetRoommateProfile?.selectedPropertyId ||
      match.snapshot?.targetProfile?.selectedPropertyId ||
      null;

    const propertyIdStr = resolvedPropertyId?.toString?.() || null;
    const leaseInfo = propertyIdStr
      ? buildLeaseInfo({
          contract: activeContractMap[propertyIdStr],
          property: propertyMap[propertyIdStr]
        })
      : null;

    return {
      ...match,
      targetUserProfile: profileMap[targetIdStr]
        ? {
            fullName: profileMap[targetIdStr].fullName,
            profilePictureUrl: profileMap[targetIdStr].profilePictureUrl,
            phoneNumber: profileMap[targetIdStr].phoneNumber
          }
        : null,
      targetRoommateProfile,
      leaseInfo
    };
  });
};
