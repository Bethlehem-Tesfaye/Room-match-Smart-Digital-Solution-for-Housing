import {
  RoommateProfile,
  RoommatePreferences,
  RoommateMatch
} from "./schema.js";
import { UserProfile } from "../profile/schema.js";
import { Property } from "../property/schema.js";
import { Contract } from "../contract/schema.js";
import { calculateRoommateMatch } from "./roommateMatcher.js";

const getOppositeType = (type) => (type === "TYPE_A" ? "TYPE_B" : "TYPE_A");

const toUserIdString = (id) => (id ? id.toString() : "");

const DAY_MS = 24 * 60 * 60 * 1000;

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const buildLeaseInfo = ({ contract, property }) => {
  if (!contract?.createdAt || !property?.leasePeriod) {
    return null;
  }

  const contractCreatedAt = new Date(contract.createdAt);
  if (Number.isNaN(contractCreatedAt.getTime())) {
    return null;
  }

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

export const generateMatchesForUser = async (userId) => {
  const currentProfile = await RoommateProfile.findOne({ userId }).lean();
  const preferences = await RoommatePreferences.findOne({ userId }).lean();

  if (!currentProfile || !preferences) {
    throw new Error("Profile or preferences missing");
  }

  const currentUserIdStr = toUserIdString(userId);

  const candidateProfiles = await RoommateProfile.find({
    profileType: getOppositeType(currentProfile.profileType)
  }).lean();

  const candidateUserIds = candidateProfiles
    .map((p) => p.userId)
    .filter((id) => toUserIdString(id) !== currentUserIdStr);

  const existingPreferenceDocs = await RoommatePreferences.find({
    userId: { $in: candidateUserIds }
  })
    .select({ userId: 1 })
    .lean();

  const userIdsWithPreferences = new Set(
    existingPreferenceDocs.map((p) => toUserIdString(p.userId))
  );

  const qualifiedCandidates = candidateProfiles.filter(
    (p) =>
      toUserIdString(p.userId) !== currentUserIdStr &&
      userIdsWithPreferences.has(toUserIdString(p.userId))
  );

  const propertyId = currentProfile.selectedPropertyId ?? null;
  const results = [];

  for (const targetProfile of qualifiedCandidates) {
    const score = calculateRoommateMatch({
      currentProfile,
      targetProfile,
      preferences
    });

    if (score <= 0) continue;

    try {
      const match = await RoommateMatch.findOneAndUpdate(
        {
          userId,
          targetUserId: targetProfile.userId,
          propertyId
        },
        {
          $set: {
            userId,
            targetUserId: targetProfile.userId,
            propertyId,
            score,
            snapshot: {
              targetProfile,
              generatedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );

      results.push(match);
    } catch (err) {
      if (err.code === 11000) continue;
      throw err;
    }
  }

  return results;
};

export const getMatchesForUser = async (userId) => {
  const matches = await RoommateMatch.find({ userId })
    .sort({ score: -1 })
    .lean();

  const targetUserIds = [
    ...new Set(matches.map((m) => m.targetUserId?.toString()).filter(Boolean))
  ];

  // Fetch basic user profile
  const userProfiles = await UserProfile.find({
    userId: { $in: targetUserIds }
  }).lean();

  // Fetch roommate profiles (THIS is what you want to add)
  const roommateProfiles = await RoommateProfile.find({
    userId: { $in: targetUserIds }
  }).lean();

  // Build maps
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

      // existing basic profile (optional)
      targetUserProfile: profileMap[targetIdStr]
        ? {
            fullName: profileMap[targetIdStr].fullName,
            profilePictureUrl: profileMap[targetIdStr].profilePictureUrl,
            phoneNumber: profileMap[targetIdStr].phoneNumber
          }
        : null,

      // FULL roommate profile attached
      targetRoommateProfile,

      leaseInfo
    };
  });
};
