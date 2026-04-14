import { calculateRoommateMatch } from "./roommateMatcher.js";
import { UserProfile } from "../../models/profile/schema.js";
import { User } from "../../models/auth/schema.js";

export const getRoommateSuggestions = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const currentProfile = await UserProfile.findOne({ userId: currentUserId });

    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please complete your profile."
      });
    }

    const otherProfiles = await UserProfile.find({
      userId: { $ne: currentUserId }
    });

    if (otherProfiles.length === 0) {
      return res.json({
        success: true,
        currentUser: {
          userId: currentUserId,
          fullName: currentProfile.fullName || "You"
        },
        matches: [],
        message: "No other users found"
      });
    }

    const userIds = otherProfiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "_id name email"
    );

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = { name: u.name, email: u.email };
    });

    const matches = otherProfiles
      .map((profile) => {
        const userIdStr = profile.userId.toString();
        const userInfo = userMap[userIdStr] || { name: "Unknown", email: "" };

        return {
          userId: profile.userId,
          name: userInfo.name,
          email: userInfo.email,
          fullName: profile.fullName,
          profilePictureUrl: profile.profilePictureUrl,
          matchScore: calculateRoommateMatch(currentProfile, profile)
        };
      })
      .filter((match) => match.matchScore > 50)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      currentUser: {
        userId: currentUserId,
        fullName: currentProfile.fullName || "You",
        preferences: {
          cleanliness: currentProfile.cleanliness,
          sleepSchedule: currentProfile.sleepSchedule,
          noiseTolerance: currentProfile.noiseTolerance,
          guests: currentProfile.guests,
          studyHabits: currentProfile.studyHabits,
          temperature: currentProfile.temperature,
          personality: currentProfile.personality,
          smoking: currentProfile.smoking,
          pets: currentProfile.pets
        }
      },
      matches, // ← FIXED: object shorthand (was matches: matches)
      totalMatches: matches.length
    });
  } catch (error) {
    console.error("Roommate matching error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const preferences = req.body;

    const allowedFields = [
      "cleanliness",
      "sleepSchedule",
      "noiseTolerance",
      "guests",
      "studyHabits",
      "temperature",
      "personality",
      "smoking",
      "pets"
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (preferences[field] !== undefined) {
        if (
          [
            "cleanliness",
            "sleepSchedule",
            "noiseTolerance",
            "guests",
            "studyHabits",
            "temperature",
            "personality"
          ].includes(field)
        ) {
          // eslint-disable-next-line radix
          const value = parseInt(preferences[field]);
          if (value >= 1 && value <= 5) {
            updateData[field] = value;
          } else {
            return res.status(400).json({
              success: false,
              message: `${field} must be between 1 and 5`
            });
          }
        }
        if (["smoking", "pets"].includes(field)) {
          if (preferences[field] === "yes" || preferences[field] === "no") {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: `${field} must be "yes" or "no"`
            });
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid preference fields provided"
      });
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: currentUserId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: {
        cleanliness: updatedProfile.cleanliness,
        sleepSchedule: updatedProfile.sleepSchedule,
        noiseTolerance: updatedProfile.noiseTolerance,
        guests: updatedProfile.guests,
        studyHabits: updatedProfile.studyHabits,
        temperature: updatedProfile.temperature,
        personality: updatedProfile.personality,
        smoking: updatedProfile.smoking,
        pets: updatedProfile.pets
      }
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyPreferences = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const profile = await UserProfile.findOne({ userId: currentUserId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    return res.json({
      success: true,
      preferences: {
        cleanliness: profile.cleanliness,
        sleepSchedule: profile.sleepSchedule,
        noiseTolerance: profile.noiseTolerance,
        guests: profile.guests,
        studyHabits: profile.studyHabits,
        temperature: profile.temperature,
        personality: profile.personality,
        smoking: profile.smoking,
        pets: profile.pets
      }
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
