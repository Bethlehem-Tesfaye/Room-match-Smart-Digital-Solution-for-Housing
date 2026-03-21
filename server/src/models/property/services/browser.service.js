import mongoose from "mongoose";
import CustomError from "../../../lib/errors.js";
import { Property, PropertyAmenity, SavedProperty } from "../schema.js";
import {
  buildPropertyResponse,
  toObjectId
} from "../../../utils/property.creator.utils.js";

const { Types } = mongoose;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildCountFilter = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "5+") return { $gte: 5 };

  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const resolveAmenityPropertyIds = async (amenities = []) => {
  if (!amenities.length) return [];

  const uniqueAmenityIds = [
    ...new Set(amenities.map((amenity) => amenity.trim()))
  ];

  if (
    uniqueAmenityIds.some((amenityId) => !Types.ObjectId.isValid(amenityId))
  ) {
    throw new CustomError("One or more amenities are invalid", 400);
  }

  const amenityObjectIds = uniqueAmenityIds.map(
    (amenityId) => new Types.ObjectId(amenityId)
  );

  const propertyAmenityMatches = await PropertyAmenity.aggregate([
    {
      $match: {
        amenityId: { $in: amenityObjectIds },
        deletedAt: null
      }
    },
    {
      $group: {
        _id: "$propertyId",
        matchedAmenityIds: { $addToSet: "$amenityId" }
      }
    },
    {
      $match: {
        $expr: {
          $eq: [{ $size: "$matchedAmenityIds" }, amenityObjectIds.length]
        }
      }
    }
  ]);

  return propertyAmenityMatches.map((propertyAmenity) => propertyAmenity._id);
};

export const listBrowserProperties = async (
  {
    page = 1,
    limit = 20,
    search = "",
    minPrice,
    maxPrice,
    propertyType,
    bedrooms,
    bathrooms,
    amenities
  } = {},
  userId = null
) => {
  const normalizedSearch = search.trim();

  const query = {
    deletedAt: null
  };

  if (normalizedSearch) {
    query.$or = [
      { title: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
      { city: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
      {
        address: {
          $regex: escapeRegex(normalizedSearch),
          $options: "i"
        }
      }
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  if (propertyType) {
    query.propertyType = propertyType;
  }

  const bedroomFilter = buildCountFilter(bedrooms);
  if (bedroomFilter !== undefined) {
    query.numberOfBedrooms = bedroomFilter;
  }

  const bathroomFilter = buildCountFilter(bathrooms);
  if (bathroomFilter !== undefined) {
    query.numberOfBathrooms = bathroomFilter;
  }

  if (amenities?.length) {
    const matchingPropertyIds = await resolveAmenityPropertyIds(amenities);

    if (!matchingPropertyIds.length) {
      return {
        properties: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: page > 1
        }
      };
    }

    query._id = { $in: matchingPropertyIds };
  }

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Property.countDocuments(query)
  ]);

  const hydratedProperties = await Promise.all(
    properties.map((property) => buildPropertyResponse(property))
  );

  const propertyIds = hydratedProperties.map((property) => property._id);
  const favoriteSet = new Set();

  if (userId && propertyIds.length) {
    const favorites = await SavedProperty.find({
      userId,
      propertyId: { $in: propertyIds },
      deletedAt: null
    })
      .select({ propertyId: 1 })
      .lean();

    favorites.forEach((favorite) => {
      favoriteSet.add(favorite.propertyId.toString());
    });
  }

  const propertiesWithFavoriteState = hydratedProperties.map((property) => ({
    ...property,
    isSaved: favoriteSet.has(property._id.toString())
  }));

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    properties: propertiesWithFavoriteState,
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

export const getBrowserPropertyDetailsForUser = async ({
  userId,
  propertyId
}) => {
  const property = await getBrowserPropertyDetails(propertyId);

  if (!userId) {
    return {
      ...property,
      isSaved: false,
      favoriteId: undefined,
      savedAt: undefined,
      favoriteNotes: undefined
    };
  }

  const favorite = await SavedProperty.findOne({
    userId,
    propertyId: property._id,
    deletedAt: null
  }).lean();

  return {
    ...property,
    isSaved: !!favorite,
    favoriteId: favorite?._id?.toString(),
    savedAt: favorite?.savedAt,
    favoriteNotes: favorite?.notes
  };
};

export const listSavedProperties = async ({
  userId,
  page = 1,
  limit = 20,
  search = ""
}) => {
  const normalizedSearch = search.trim();
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        userId,
        deletedAt: null
      }
    },
    {
      $lookup: {
        from: "property",
        localField: "propertyId",
        foreignField: "_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    {
      $match: {
        "property.deletedAt": null,
        ...(normalizedSearch
          ? {
              $or: [
                {
                  "property.title": {
                    $regex: escapeRegex(normalizedSearch),
                    $options: "i"
                  }
                },
                {
                  "property.city": {
                    $regex: escapeRegex(normalizedSearch),
                    $options: "i"
                  }
                },
                {
                  "property.address": {
                    $regex: escapeRegex(normalizedSearch),
                    $options: "i"
                  }
                }
              ]
            }
          : {})
      }
    },
    { $sort: { savedAt: -1 } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }]
      }
    }
  ];

  const [result] = await SavedProperty.aggregate(pipeline);
  const savedItems = result?.items ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  const properties = await Promise.all(
    savedItems.map(async (item) => {
      const property = await buildPropertyResponse(item.property);

      return {
        ...property,
        isSaved: true,
        favoriteId: item._id.toString(),
        savedAt: item.savedAt,
        favoriteNotes: item.notes ?? ""
      };
    })
  );

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    properties,
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
