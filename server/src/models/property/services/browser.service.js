import CustomError from "../../../lib/errors.js";
import { Property, SavedProperty } from "../schema.js";
import {
  buildPropertyResponse,
  toObjectId
} from "../../../utils/property.creator.utils.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listBrowserProperties = async ({
  page = 1,
  limit = 20,
  search = ""
} = {}) => {
  const normalizedSearch = search.trim();

  const query = {
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

  const hydratedProperties = await Promise.all(
    properties.map((property) => buildPropertyResponse(property))
  );

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    properties: hydratedProperties,
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
