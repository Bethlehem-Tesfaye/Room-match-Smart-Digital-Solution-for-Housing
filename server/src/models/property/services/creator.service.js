import CustomError from "../../../lib/errors.js";
import { Property, PropertyAmenity, PropertyImage } from "../schema.js";
import {
  buildPropertyResponse,
  ensureOwnership,
  syncPropertyAmenities,
  syncPropertyImages,
  toObjectId,
  validateAmenityIdsExist
} from "../../../utils/property.creator.utils.js";

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

  const { images, amenityIds, ...propertyUpdates } = payload;

  if (amenityIds !== undefined) {
    await validateAmenityIdsExist(amenityIds);
  }

  if (Object.keys(propertyUpdates).length > 0) {
    await Property.updateOne({ _id }, { $set: propertyUpdates });
  }

  if (images !== undefined) {
    await syncPropertyImages({ propertyId: _id, images });
  }

  if (amenityIds !== undefined) {
    await syncPropertyAmenities({ propertyId: _id, amenityIds });
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

export const getMyProperties = async (userId) => {
  const properties = await Property.find({ ownerId: userId, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    properties.map((property) => buildPropertyResponse(property))
  );
};
