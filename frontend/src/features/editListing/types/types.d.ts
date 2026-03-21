import type { PropertyType } from "../../property/types/type";

export type EditListingSectionKey =
  | "details"
  | "location"
  | "photos"
  | "amenities";

export interface EditListingImageDraft {
  id: string;
  imageUrl?: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
}

export interface EditListingDraft {
  title: string;
  description: string;
  propertyType: PropertyType;
  price: string;
  currency: string;
  deposit: string;
  numberOfBedrooms: string;
  numberOfBathrooms: string;
  floorNumber: string;
  totalFloors: string;
  areaSqFt: string;
  address: string;
  city: string;
  images: EditListingImageDraft[];
  amenityIds: string[];
  availableFrom: string;
  isFurnished: boolean;
}

export interface EditListingValidationErrors {
  title?: string;
  price?: string;
  address?: string;
  city?: string;
  images?: string;
}
