import mongoose from "mongoose";
import CustomError from "../lib/errors.js";
import { cloudinary } from "../lib/cloudinary.js";
import {
  Amenity,
  PropertyAmenity,
  PropertyImage
} from "../models/property/schema.js";

const { Types } = mongoose;

export const toObjectId = (value) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError("Invalid property id", 400);
  }

  return new Types.ObjectId(value);
};

export const ensureOwnership = (property, userId) => {
  if (!property || property.deletedAt) {
    throw new CustomError("Property not found", 404);
  }

  if (property.ownerId !== userId) {
    throw new CustomError("You are not allowed to modify this property", 403);
  }
};

const normalizeAmenityIds = (amenityIds = []) => {
  return amenityIds.map((id) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new CustomError("One or more amenity ids are invalid", 400);
    }

    return new Types.ObjectId(id);
  });
};

export const validateAmenityIdsExist = async (amenityIds = []) => {
  if (!amenityIds.length) return [];

  const normalizedAmenityIds = normalizeAmenityIds(amenityIds);
  const uniqueAmenityIds = [
    ...new Set(normalizedAmenityIds.map((amenityId) => amenityId.toString()))
  ].map((id) => new Types.ObjectId(id));

  const existingAmenitiesCount = await Amenity.countDocuments({
    _id: { $in: uniqueAmenityIds }
  });

  if (existingAmenitiesCount !== uniqueAmenityIds.length) {
    throw new CustomError("One or more amenities do not exist", 400);
  }

  return uniqueAmenityIds;
};

export const buildPropertyResponse = async (propertyDoc) => {
  if (!propertyDoc) return null;

  const propertyId = propertyDoc._id;

  const [images, propertyAmenities] = await Promise.all([
    PropertyImage.find({ propertyId, deletedAt: null })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean(),
    PropertyAmenity.find({ propertyId, deletedAt: null }).lean()
  ]);

  return {
    ...propertyDoc,
    images,
    amenityIds: propertyAmenities.map((item) => item.amenityId.toString())
  };
};

const uploadPropertyImage = async ({ imageBase64, propertyId }) => {
  try {
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: "roomMatch/property",
      public_id: `property_${propertyId}_${Date.now()}`,
      resource_type: "image"
    });

    return result.secure_url;
  } catch (_err) {
    throw new CustomError("Failed to upload property image", 400);
  }
};

const resolvePropertyImageUrl = async ({ image, propertyId }) => {
  if (image.imageBase64) {
    return uploadPropertyImage({
      imageBase64: image.imageBase64,
      propertyId
    });
  }

  if (image.imageUrl) {
    return image.imageUrl;
  }

  throw new CustomError("Each image must include imageBase64 or imageUrl", 400);
};

export const syncPropertyImages = async ({ propertyId, images = [] }) => {
  await PropertyImage.updateMany(
    { propertyId, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );

  if (!images.length) return;

  const uploadedImages = await Promise.all(
    images.map(async (image) => ({
      propertyId,
      imageUrl: await resolvePropertyImageUrl({ image, propertyId }),
      isPrimary: !!image.isPrimary,
      uploadDate: new Date(),
      deletedAt: null
    }))
  );

  await PropertyImage.insertMany(uploadedImages);
};

export const syncPropertyAmenities = async ({
  propertyId,
  amenityIds = []
}) => {
  await PropertyAmenity.updateMany(
    { propertyId, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );

  if (!amenityIds.length) return;

  const validatedAmenityIds = await validateAmenityIdsExist(amenityIds);

  await Promise.all(
    validatedAmenityIds.map((amenityId) =>
      PropertyAmenity.updateOne(
        { propertyId, amenityId },
        {
          $set: { deletedAt: null },
          $setOnInsert: { propertyId, amenityId }
        },
        { upsert: true }
      )
    )
  );
};
