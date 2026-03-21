import mongoose from "mongoose";

const { Schema, model, models, Types } = mongoose;

const propertySchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "" },
    propertyType: {
      type: String,
      enum: ["Apartment", "House", "Condo", "Studio", "SharedRoom"],
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: "ETB", maxlength: 10 },
    deposit: { type: Number, default: 0, min: 0 },
    address: { type: String, required: true, trim: true, maxlength: 255 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    numberOfBedrooms: { type: Number, default: 0, min: 0 },
    numberOfBathrooms: { type: Number, default: 0, min: 0 },
    floorNumber: { type: Number, default: null },
    totalFloors: { type: Number, default: null },
    areaSqFt: { type: Number, default: null, min: 0 },
    isFurnished: { type: Boolean, default: false },
    availableFrom: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Active", "Rented", "Inactive"],
      default: "Active"
    },
    deletedAt: { type: Date, default: null }
  },
  {
    collection: "property",
    timestamps: true,
    versionKey: false
  }
);

propertySchema.index({ ownerId: 1, createdAt: -1 });
propertySchema.index({ city: 1, status: 1, deletedAt: 1 });

const propertyImageSchema = new Schema(
  {
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    imageUrl: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    uploadDate: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
  },
  {
    collection: "propertyImage",
    timestamps: true,
    versionKey: false
  }
);

const amenitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 100 }
  },
  {
    collection: "amenity",
    timestamps: true,
    versionKey: false
  }
);

amenitySchema.index({ name: 1, category: 1 }, { unique: true });

const propertyAmenitySchema = new Schema(
  {
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    amenityId: {
      type: Types.ObjectId,
      ref: "Amenity",
      required: true,
      index: true
    },
    deletedAt: { type: Date, default: null }
  },
  {
    collection: "propertyAmenity",
    timestamps: true,
    versionKey: false
  }
);

propertyAmenitySchema.index({ propertyId: 1, amenityId: 1 }, { unique: true });

const savedPropertySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    savedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    deletedAt: { type: Date, default: null }
  },
  {
    collection: "savedProperty",
    timestamps: true,
    versionKey: false
  }
);

savedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const Property = models.Property || model("Property", propertySchema);
export const PropertyImage =
  models.PropertyImage || model("PropertyImage", propertyImageSchema);
export const Amenity = models.Amenity || model("Amenity", amenitySchema);
export const PropertyAmenity =
  models.PropertyAmenity || model("PropertyAmenity", propertyAmenitySchema);
export const SavedProperty =
  models.SavedProperty || model("SavedProperty", savedPropertySchema);

export default {
  Property,
  PropertyImage,
  Amenity,
  PropertyAmenity,
  SavedProperty
};
