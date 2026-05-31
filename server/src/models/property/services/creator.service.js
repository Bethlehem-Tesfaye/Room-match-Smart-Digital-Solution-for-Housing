import mongoose from "mongoose";
import CustomError from "../../../lib/errors.js";
import { clearMatchesForUser } from "../../roommate/match.service.js";
import { RoommateProfile } from "../../roommate/schema.js";
import { UserProfile } from "../../profile/schema.js";
import * as notificationService from "../../notification/notification.service.js";
import {
  Amenity,
  Property,
  PropertyAmenity,
  PropertyImage
} from "../schema.js";
import {
  buildPropertyResponse,
  ensureOwnership,
  syncPropertyAmenities,
  syncPropertyImages,
  toObjectId,
  validateAmenityIdsExist
} from "../../../utils/property.creator.utils.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createProperty = async ({ userId, payload }) => {
  const { images = [], amenityIds = [], ...propertyFields } = payload;

  await validateAmenityIdsExist(amenityIds);

  const property = await Property.create({
    ...propertyFields,
    ownerId: userId
  });

  await Promise.all([
    syncPropertyImages({ propertyId: property._id, images }),
    syncPropertyAmenities({ propertyId: property._id, amenityIds })
  ]);

  const saved = await Property.findById(property._id).lean();

  try {
    const adminProfiles = await UserProfile.find({
      role: "admin",
      deletedAt: null
    })
      .select("userId")
      .lean();

    await Promise.all(
      adminProfiles.map((admin) =>
        notificationService.createNotification({
          userId: admin.userId,
          type: "ListingUpdate",
          title: "New property added",
          content: `A new property listing was added: ${property.title || "Untitled listing"}.`,
          relatedEntityId: property._id
        })
      )
    );
  } catch (notifyErr) {
    // Do not block property creation for notification failures.
  }

  return buildPropertyResponse(saved);
};

export const getPropertyById = async (propertyId) => {
  const _id = toObjectId(propertyId);
  const property = await Property.findOne({ _id, deletedAt: null }).lean();

  if (!property) {
    throw new CustomError("Property not found", 404);
  }

  return buildPropertyResponse(property);
};

export const updatePropertyById = async ({ propertyId, userId, payload }) => {
  const _id = toObjectId(propertyId);
  const property = await Property.findById(_id).lean();

  ensureOwnership(property, userId);

  if (property.status === "Rented") {
    throw new CustomError("Rented properties cannot be edited", 409);
  }

  const { images, amenityIds, ...propertyUpdates } = payload;
  const allowRoommatesChangedToFalse =
    property.allowRoommates === true &&
    propertyUpdates.allowRoommates === false;

  let amenityIdsToSync = amenityIds;

  if (amenityIds !== undefined) {
    const incomingAmenityIds = Array.isArray(amenityIds) ? amenityIds : [];

    const normalizedAmenityIds = incomingAmenityIds.filter((amenityId) =>
      mongoose.Types.ObjectId.isValid(amenityId)
    );

    if (normalizedAmenityIds.length !== incomingAmenityIds.length) {
      throw new CustomError("One or more amenities do not exist", 400);
    }

    const existingAmenities = await Amenity.find({
      _id: { $in: normalizedAmenityIds }
    })
      .select({ _id: 1 })
      .lean();

    const existingAmenityIdSet = new Set(
      existingAmenities.map((amenity) => amenity._id.toString())
    );

    amenityIdsToSync = normalizedAmenityIds.filter((amenityId) =>
      existingAmenityIdSet.has(amenityId.toString())
    );

    if (amenityIdsToSync.length === 0) {
      amenityIdsToSync = undefined;
    }
  }

  if (Object.keys(propertyUpdates).length > 0) {
    await Property.updateOne({ _id }, { $set: propertyUpdates });
  }

  if (images !== undefined) {
    await syncPropertyImages({ propertyId: _id, images });
  }

  if (amenityIdsToSync !== undefined) {
    await syncPropertyAmenities({
      propertyId: _id,
      amenityIds: amenityIdsToSync
    });
  }

  if (allowRoommatesChangedToFalse) {
    const affectedProfiles = await RoommateProfile.find({
      profileType: "TYPE_A",
      selectedPropertyId: _id
    })
      .select({ userId: 1 })
      .lean();

    await Promise.all(
      affectedProfiles.map(async (profile) => {
        await clearMatchesForUser(profile.userId);
      })
    );

    if (affectedProfiles.length > 0) {
      await RoommateProfile.updateMany(
        { profileType: "TYPE_A", selectedPropertyId: _id },
        { $set: { selectedPropertyId: null, updatedFrom: "matching" } }
      );
    }
  }

  const updated = await Property.findOne({ _id, deletedAt: null }).lean();
  return buildPropertyResponse(updated);
};

export const deletePropertyById = async ({ propertyId, userId }) => {
  const _id = toObjectId(propertyId);
  const property = await Property.findById(_id).lean();

  ensureOwnership(property, userId);

  const now = new Date();

  await Promise.all([
    Property.updateOne(
      { _id },
      { $set: { deletedAt: now, status: "Inactive" } }
    ),
    PropertyImage.updateMany(
      { propertyId: _id, deletedAt: null },
      { $set: { deletedAt: now } }
    ),
    PropertyAmenity.updateMany(
      { propertyId: _id, deletedAt: null },
      { $set: { deletedAt: now } }
    )
  ]);
};

export const getMyProperties = async ({
  userId,
  page = 1,
  limit = 20,
  search = ""
}) => {
  const normalizedSearch = search.trim();
  const query = {
    ownerId: userId,
    deletedAt: null,
    ...(normalizedSearch
      ? {
          $or: [
            { title: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
            { city: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
            {
              address: {
                $regex: escapeRegex(normalizedSearch),
                $options: "i"
              }
            }
          ]
        }
      : {})
  };

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Property.countDocuments(query)
  ]);

  const mappedProperties = await Promise.all(
    properties.map((property) => buildPropertyResponse(property))
  );

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    properties: mappedProperties,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const getMyListingCounts = async (userId) => {
  const [totalListings, activeListings] = await Promise.all([
    Property.countDocuments({ ownerId: userId, deletedAt: null }),
    Property.countDocuments({
      ownerId: userId,
      deletedAt: null,
      status: "Active"
    })
  ]);

  return {
    totalListings,
    activeListings
  };
};
