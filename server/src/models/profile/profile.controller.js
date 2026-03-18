import {
  getProfileByUserId,
  updateProfileByUserId
} from "./profile.service.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfileByUserId(req.userId);
    return res.status(200).json({ profile });
  } catch (err) {
    return next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await updateProfileByUserId({
      userId: req.userId,
      name: req.user?.name,
      payload: req.body
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (err) {
    return next(err);
  }
};
