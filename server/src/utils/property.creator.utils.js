import mongoose from "mongoose";
import CustomError from "../lib/errors.js";
import {
  Amenity,
  PropertyAmenity,
  PropertyImage
} from "../models/property/schema.js";
import { User } from "../models/auth/schema.js";

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

  const ownerObjectId = Types.ObjectId.isValid(propertyDoc.ownerId)
    ? new Types.ObjectId(propertyDoc.ownerId)
    : null;

  const [images, propertyAmenities, owner] = await Promise.all([
    PropertyImage.find({ propertyId, deletedAt: null })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean(),
    PropertyAmenity.find({ propertyId, deletedAt: null }).lean(),
    ownerObjectId
      ? User.findOne({ _id: ownerObjectId })
          .select({ _id: 1, name: 1, email: 1, image: 1 })
          .lean()
      : null
  ]);

  const amenityObjectIds = propertyAmenities.map((item) => item.amenityId);

  const amenities = amenityObjectIds.length
    ? await Amenity.find({ _id: { $in: amenityObjectIds } })
        .select({ _id: 1, name: 1, category: 1 })
        .lean()
    : [];

  const amenityById = new Map(
    amenities.map((amenity) => [amenity._id.toString(), amenity])
  );

  const resolvedAmenities = propertyAmenities
    .map((item) => amenityById.get(item.amenityId.toString()))
    .filter(Boolean);

  return {
    ...propertyDoc,
    images,
    owner: owner
      ? {
          _id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          image: owner.image ?? ""
        }
      : null,
    amenityIds: propertyAmenities.map((item) => item.amenityId.toString()),
    amenities: resolvedAmenities.map((amenity) => ({
      _id: amenity._id.toString(),
      name: amenity.name,
      category: amenity.category
    }))
  };
};

const resolvePropertyImageUrl = async ({ image }) => {
  if (image.imageUrl) {
    return image.imageUrl;
  }

  throw new CustomError("Each image must include imageUrl", 400);
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
      imageUrl: await resolvePropertyImageUrl({ image }),
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
