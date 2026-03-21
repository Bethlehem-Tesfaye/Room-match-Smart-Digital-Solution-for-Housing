import { z } from "zod";

const propertyTypeEnum = z.enum([
  "Apartment",
  "House",
  "Condo",
  "Studio",
  "SharedRoom"
]);

const propertyStatusEnum = z.enum(["Active", "Rented", "Inactive"]);
const browserCountFilterEnum = z.enum(["1", "2", "3", "4", "5+"]);

const amenitiesQuerySchema = z
  .union([z.string().trim(), z.array(z.string().trim())])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;

    const normalizedAmenities = (Array.isArray(value) ? value : value.split(","))
      .map((amenity) => amenity.trim())
      .filter(Boolean);

    return normalizedAmenities.length ? normalizedAmenities : undefined;
  });

const imageInputSchema = z
  .object({
    imageUrl: z.string().trim().url().optional(),
    isPrimary: z.boolean().optional()
  })
  .refine((image) => !!image.imageUrl, "Each image must include imageUrl");

export const propertyParamsSchema = z.object({
  id: z.string().trim().min(1, "Property id is required")
});

export const browsePropertyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().max(100).optional().default(""),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  propertyType: propertyTypeEnum.optional(),
  bedrooms: browserCountFilterEnum.optional(),
  bathrooms: browserCountFilterEnum.optional(),
  amenities: amenitiesQuerySchema
}).refine(
  ({ minPrice, maxPrice }) =>
    minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
  {
    message: "Minimum price cannot exceed maximum price",
    path: ["minPrice"]
  }
);

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  propertyType: propertyTypeEnum,
  price: z.number().nonnegative(),
  currency: z.string().trim().max(10).optional().default("ETB"),
  deposit: z.number().nonnegative().optional().default(0),
  address: z.string().trim().min(3).max(255),
  city: z.string().trim().min(2).max(100),
  numberOfBedrooms: z.number().int().nonnegative().optional().default(0),
  numberOfBathrooms: z.number().int().nonnegative().optional().default(0),
  floorNumber: z.number().int().nullable().optional(),
  totalFloors: z.number().int().nullable().optional(),
  areaSqFt: z.number().nonnegative().nullable().optional(),
  isFurnished: z.boolean().optional().default(false),
  availableFrom: z.coerce.date().nullable().optional(),
  status: propertyStatusEnum.optional().default("Active"),
  images: z.array(imageInputSchema).optional().default([]),
  amenityIds: z.array(z.string().trim().min(1)).optional().default([])
});

export const updatePropertySchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    propertyType: propertyTypeEnum.optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().trim().max(10).optional(),
    deposit: z.number().nonnegative().optional(),
    address: z.string().trim().min(3).max(255).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    numberOfBedrooms: z.number().int().nonnegative().optional(),
    numberOfBathrooms: z.number().int().nonnegative().optional(),
    floorNumber: z.number().int().nullable().optional(),
    totalFloors: z.number().int().nullable().optional(),
    areaSqFt: z.number().nonnegative().nullable().optional(),
    isFurnished: z.boolean().optional(),
    availableFrom: z.coerce.date().nullable().optional(),
    status: propertyStatusEnum.optional(),
    images: z.array(imageInputSchema).optional(),
    amenityIds: z.array(z.string().trim().min(1)).optional()
  })
  .refine(
    (payload) => Object.keys(payload).length > 0,
    "At least one field is required for update"
  );

export const saveFavoriteSchema = z.object({
  notes: z.string().trim().max(1000).optional()
});
