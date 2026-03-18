import CustomError from "../../lib/errors.js";
import { cloudinary } from "../../lib/cloudinary.js";
import { UserProfile } from "./schema.js";

const normalizePhoneNumber = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
};

const uploadProfileImage = async (imageBase64, userId) => {
  try {
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: "roomMatch/profile",
      public_id: `user_${userId}_${Date.now()}`,
      resource_type: "image"
    });

    return result.secure_url;
  } catch (_err) {
    throw new CustomError("Failed to upload profile image", 400);
  }
};

export const getProfileByUserId = async (userId) => {
  const profile = await UserProfile.findOne({ userId }).lean();

  if (!profile) {
    throw new CustomError("Profile not found", 404);
  }

  return profile;
};

export const updateProfileByUserId = async ({ userId, name, payload }) => {
  const updateSet = {};
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);

  if (payload.fullName !== undefined) {
    updateSet.fullName = payload.fullName;
  }

  if (payload.phoneNumber !== undefined) {
    updateSet.phoneNumber = normalizedPhoneNumber;
  }

  if (payload.imageBase64) {
    updateSet.profilePictureUrl = await uploadProfileImage(
      payload.imageBase64,
      userId
    );
  }

  if (payload.removeProfilePicture === true) {
    updateSet.profilePictureUrl = null;
  }

  const insertOnlySet = {
    userId,
    role: "user",
    deletedAt: null
  };

  if (updateSet.fullName === undefined) {
    insertOnlySet.fullName = payload.fullName ?? name ?? "";
  }

  if (updateSet.phoneNumber === undefined) {
    insertOnlySet.phoneNumber = normalizedPhoneNumber;
  }

  if (updateSet.profilePictureUrl === undefined) {
    insertOnlySet.profilePictureUrl = null;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: updateSet,
      $setOnInsert: insertOnlySet
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  ).lean();

  if (!profile) {
    throw new CustomError("Unable to update profile", 500);
  }

  return profile;
};
