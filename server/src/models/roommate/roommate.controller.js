import {
  getRoommatePreferencesByUserId,
  getRoommateProfileByUserId,
  updateRoommatePreferencesByUserId,
  updateRoommateProfileByUserId
} from "./roommate.service.js";

export const getMyRoommateProfile = async (req, res, next) => {
  try {
    const profile = await getRoommateProfileByUserId(req.userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json({
      success: true,
      profile
    });
  } catch (err) {
    return next(err);
  }
};

export const updateMyRoommateProfile = async (req, res, next) => {
  try {
    const profile = await updateRoommateProfileByUserId({
      userId: req.userId,
      payload: req.body
    });

    return res.status(200).json({
      success: true,
      message: "Roommate profile updated successfully",
      profile
    });
  } catch (err) {
    return next(err);
  }
};

export const getMyRoommatePreferences = async (req, res, next) => {
  try {
    const preferences = await getRoommatePreferencesByUserId(req.userId);

    return res.status(200).json({
      success: true,
      preferences
    });
  } catch (err) {
    return next(err);
  }
};

export const updateMyRoommatePreferences = async (req, res, next) => {
  try {
    const preferences = await updateRoommatePreferencesByUserId({
      userId: req.userId,
      payload: req.body
    });

    return res.status(200).json({
      success: true,
      message: "Roommate preferences updated successfully",
      preferences
    });
  } catch (err) {
    return next(err);
  }
};
