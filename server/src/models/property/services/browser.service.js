import CustomError from "../../../lib/errors.js";
import { Property, SavedProperty } from "../schema.js";
import {
  buildPropertyResponse,
  toObjectId
} from "../../../utils/property.creator.utils.js";

export const listBrowserProperties = async () => {
  const properties = await Property.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    properties.map((property) => buildPropertyResponse(property))
  );
};

export const getBrowserPropertyDetails = async (propertyId) => {
  const _id = toObjectId(propertyId);

  const property = await Property.findOne({ _id, deletedAt: null }).lean();

  if (!property) {
    throw new CustomError("Property not found", 404);
  }

  return buildPropertyResponse(property);
};

export const savePropertyToFavorite = async ({ userId, propertyId, notes }) => {
  const _id = toObjectId(propertyId);

  const property = await Property.findOne({ _id, deletedAt: null }).lean();

  if (!property) {
    throw new CustomError("Property not found", 404);
  }

  const favorite = await SavedProperty.findOneAndUpdate(
    { userId, propertyId: _id },
    {
      $set: {
        notes: notes ?? "",
        savedAt: new Date(),
        deletedAt: null
      },
      $setOnInsert: {
        userId,
        propertyId: _id
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  ).lean();

  return favorite;
};

export const removePropertyFromFavorite = async ({ userId, propertyId }) => {
  const _id = toObjectId(propertyId);

  const removeResult = await SavedProperty.updateOne(
    { userId, propertyId: _id, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );

  if (removeResult.modifiedCount === 0) {
    throw new CustomError("Favorite property not found", 404);
  }
};
