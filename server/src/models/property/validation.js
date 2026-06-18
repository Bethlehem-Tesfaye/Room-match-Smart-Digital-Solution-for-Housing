import { z } from "zod";

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const availableFromSchema = z
  .preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }
      return value;
    },
    z.coerce.date({
      required_error: "Available from date is required",
      invalid_type_error: "Available from date is required"
    })
  )
  .refine((date) => date >= startOfToday(), {
    message: "Available from date cannot be in the past"
  });

const propertyTypeEnum = z.enum([
  "Apartment",
  "House",
  "Condo",
  "Studio",
  "SharedRoom"
]);

const propertyStatusEnum = z.enum(["Active", "Reserved", "Rented", "Inactive"]);
const browserCountFilterEnum = z.enum(["1", "2", "3", "4", "5+"]);

const amenitiesQuerySchema = z
  .union([z.string().trim(), z.array(z.string().trim())])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;

    const normalizedAmenities = (
      Array.isArray(value) ? value : value.split(",")
    )
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

export const browsePropertyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    search: z.string().trim().max(100).optional().default(""),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    propertyType: propertyTypeEnum.optional(),
    bedrooms: browserCountFilterEnum.optional(),
    bathrooms: browserCountFilterEnum.optional(),
    amenities: amenitiesQuerySchema
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: "Minimum price cannot exceed maximum price",
      path: ["minPrice"]
    }
  );

export const createPropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(""),
  propertyType: z.enum(["Apartment", "House", "Condo", "Studio", "SharedRoom"]),

  // Use z.coerce.number() for all numeric fields — this handles "2000" → 2000
  price: z.coerce.number().positive(),
  numberOfBedrooms: z.coerce.number().min(0),
  numberOfBathrooms: z.coerce.number().min(0),
  floorNumber: z.coerce.number().min(0).optional().nullable(),
  totalFloors: z.coerce.number().min(0).optional().nullable(),
  areaSqFt: z.coerce.number().min(0).optional().nullable(),
  leasePeriod: z.coerce.number().positive(),
  initialPayment: z.coerce.number().min(0),

  currency: z.string().default("ETB"),
  address: z.string().min(1),
  city: z.string().min(1),
  availableFrom: availableFromSchema,
  isFurnished: z.coerce.boolean().default(false),
  allowRoommates: z.coerce.boolean().default(false),
  status: z.string().optional().default("Active"),
  amenityIds: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).default([])),
  primaryImageIndex: z.coerce.number().min(0).default(0)
});

export const updatePropertySchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    propertyType: propertyTypeEnum.optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().trim().max(10).optional(),
    leasePeriod: z.number().int().positive().optional(),
    initialPayment: z.number().nonnegative().optional(),
    address: z.string().trim().min(3).max(255).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    numberOfBedrooms: z.number().int().nonnegative().optional(),
    numberOfBathrooms: z.number().int().nonnegative().optional(),
    floorNumber: z.number().int().nullable().optional(),
    totalFloors: z.number().int().nullable().optional(),
    areaSqFt: z.number().nonnegative().nullable().optional(),
    isFurnished: z.boolean().optional(),
    allowRoommates: z.boolean().optional(),
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
