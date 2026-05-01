import {
  RoommateProfile,
  RoommatePreferences,
  RoommateMatch
} from "./schema.js";
import { UserProfile } from "../profile/schema.js";
import { calculateRoommateMatch } from "./roommateMatcher.js";

const getOppositeType = (type) => (type === "TYPE_A" ? "TYPE_B" : "TYPE_A");

const toUserIdString = (id) => (id ? id.toString() : "");

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

  return matches.map((match) => {
    const targetIdStr = match.targetUserId?.toString();

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
      targetRoommateProfile: roommateProfileMap[targetIdStr] || null
    };
  });
};
