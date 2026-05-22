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
          matchScore: calculateRoommateMatch(currentProfile, profile),
          // New fields from documentation
          budgetMin: profile.budgetMin,
          budgetMax: profile.budgetMax,
          preferredLocations: profile.preferredLocations,
          moveInDate: profile.moveInDate,
          stayDurationMonths: profile.stayDurationMonths,
          drinking: profile.drinking,
          occupation: profile.occupation,
          interests: profile.interests,
          aboutMe: profile.aboutMe
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
          // Existing fields
          cleanliness: currentProfile.cleanliness,
          sleepSchedule: currentProfile.sleepSchedule,
          noiseTolerance: currentProfile.noiseTolerance,
          guests: currentProfile.guests,
          studyHabits: currentProfile.studyHabits,
          temperature: currentProfile.temperature,
          personality: currentProfile.personality,
          smoking: currentProfile.smoking,
          pets: currentProfile.pets,
          // New fields
          budgetMin: currentProfile.budgetMin,
          budgetMax: currentProfile.budgetMax,
          preferredLocations: currentProfile.preferredLocations,
          moveInDate: currentProfile.moveInDate,
          stayDurationMonths: currentProfile.stayDurationMonths,
          drinking: currentProfile.drinking,
          occupation: currentProfile.occupation,
          interests: currentProfile.interests,
          aboutMe: currentProfile.aboutMe
        }
      },
      matches,
      totalMatches: matches.length
    });
  } catch (error) {
    // console.error("Roommate matching error:", error);
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
      // Existing fields
      "cleanliness",
      "sleepSchedule",
      "noiseTolerance",
      "guests",
      "studyHabits",
      "temperature",
      "personality",
      "smoking",
      "pets",
      // New fields
      "budgetMin",
      "budgetMax",
      "preferredLocations",
      "moveInDate",
      "stayDurationMonths",
      "drinking",
      "occupation",
      "interests",
      "aboutMe"
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (preferences[field] !== undefined) {
        // Number fields (1-5 range)
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
        // Budget fields
        else if (field === "budgetMin" || field === "budgetMax") {
          const rawValue = preferences[field];
          if (rawValue === "" || rawValue === null) {
            return res.status(400).json({
              success: false,
              message:
                field === "budgetMin"
                  ? "Minimum budget field can't be empty"
                  : "Maximum budget field can't be empty"
            });
          }

          const value = Number(rawValue);

          if (!Number.isFinite(value)) {
            return res.status(400).json({
              success: false,
              message:
                field === "budgetMin"
                  ? "Minimum budget must be a valid number"
                  : "Maximum budget must be a valid number"
            });
          }

          if (value < 0) {
            return res.status(400).json({
              success: false,
              message:
                field === "budgetMin"
                  ? "Minimum budget must be zero or greater"
                  : "Maximum budget must be zero or greater"
            });
          }

          updateData[field] = value;
        }
        // Stay duration (1-60 months)
        else if (field === "stayDurationMonths") {
          // eslint-disable-next-line radix
          const value = parseInt(preferences[field]);
          if (value >= 1 && value <= 60) {
            updateData[field] = value;
          } else {
            return res.status(400).json({
              success: false,
              message: "Stay duration must be between 1 and 60 months"
            });
          }
        }
        // Location array
        else if (field === "preferredLocations") {
          if (Array.isArray(preferences[field])) {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: "Preferred locations must be an array"
            });
          }
        }
        // Interests array
        else if (field === "interests") {
          if (Array.isArray(preferences[field])) {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: "Interests must be an array"
            });
          }
        }
        // Move-in date
        else if (field === "moveInDate") {
          if (preferences[field] === null || preferences[field] === "") {
            updateData[field] = null;
          } else {
            const date = new Date(preferences[field]);
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(date.getTime())) {
              updateData[field] = date;
            } else {
              return res.status(400).json({
                success: false,
                message: "Invalid move-in date"
              });
            }
          }
        }
        // Smoking, Pets (yes/no)
        else if (["smoking", "pets"].includes(field)) {
          if (preferences[field] === "yes" || preferences[field] === "no") {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: `${field} must be "yes" or "no"`
            });
          }
        }
        // Drinking (yes/no/sometimes)
        else if (field === "drinking") {
          if (
            preferences[field] === "yes" ||
            preferences[field] === "no" ||
            preferences[field] === "sometimes"
          ) {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: 'Drinking must be "yes", "no", or "sometimes"'
            });
          }
        }
        // Occupation (student, working, remote, hybrid, unemployed)
        else if (field === "occupation") {
          const validOccupations = [
            "student",
            "working",
            "remote",
            "hybrid",
            "unemployed"
          ];
          if (validOccupations.includes(preferences[field])) {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message:
                'Occupation must be "student", "working", "remote", "hybrid", or "unemployed"'
            });
          }
        }
        // About Me (text, max 500 chars)
        else if (field === "aboutMe") {
          if (preferences[field].length <= 500) {
            updateData[field] = preferences[field];
          } else {
            return res.status(400).json({
              success: false,
              message: "About Me must be 500 characters or less"
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

    if (
      updateData.budgetMin !== undefined ||
      updateData.budgetMax !== undefined
    ) {
      const existingProfile = await UserProfile.findOne({
        userId: currentUserId
      });
      const budgetMin =
        updateData.budgetMin !== undefined
          ? updateData.budgetMin
          : existingProfile?.budgetMin;
      const budgetMax =
        updateData.budgetMax !== undefined
          ? updateData.budgetMax
          : existingProfile?.budgetMax;

      if (
        Number.isFinite(budgetMin) &&
        Number.isFinite(budgetMax) &&
        budgetMin > budgetMax
      ) {
        return res.status(400).json({
          success: false,
          message: "Minimum budget cannot be greater than maximum budget"
        });
      }
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
        // Existing
        cleanliness: updatedProfile.cleanliness,
        sleepSchedule: updatedProfile.sleepSchedule,
        noiseTolerance: updatedProfile.noiseTolerance,
        guests: updatedProfile.guests,
        studyHabits: updatedProfile.studyHabits,
        temperature: updatedProfile.temperature,
        personality: updatedProfile.personality,
        smoking: updatedProfile.smoking,
        pets: updatedProfile.pets,
        // New
        budgetMin: updatedProfile.budgetMin,
        budgetMax: updatedProfile.budgetMax,
        preferredLocations: updatedProfile.preferredLocations,
        moveInDate: updatedProfile.moveInDate,
        stayDurationMonths: updatedProfile.stayDurationMonths,
        drinking: updatedProfile.drinking,
        occupation: updatedProfile.occupation,
        interests: updatedProfile.interests,
        aboutMe: updatedProfile.aboutMe
      }
    });
  } catch (error) {
    // console.error("Update preferences error:", error);
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
        // Existing
        cleanliness: profile.cleanliness,
        sleepSchedule: profile.sleepSchedule,
        noiseTolerance: profile.noiseTolerance,
        guests: profile.guests,
        studyHabits: profile.studyHabits,
        temperature: profile.temperature,
        personality: profile.personality,
        smoking: profile.smoking,
        pets: profile.pets,
        // New
        budgetMin: profile.budgetMin,
        budgetMax: profile.budgetMax,
        preferredLocations: profile.preferredLocations,
        moveInDate: profile.moveInDate,
        stayDurationMonths: profile.stayDurationMonths,
        drinking: profile.drinking,
        occupation: profile.occupation,
        interests: profile.interests,
        aboutMe: profile.aboutMe
      }
    });
  } catch (error) {
    // console.error("Get preferences error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
