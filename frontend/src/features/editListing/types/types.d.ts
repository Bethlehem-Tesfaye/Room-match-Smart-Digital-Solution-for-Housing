import type { PropertyType } from "../../property/types/type";

export type EditListingSectionKey =
  | "details"
  | "location"
  | "photos"
  | "bank"
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
  leasePeriod: string;
  initialPayment: string;
  images: EditListingImageDraft[];
  amenityIds: string[];
  availableFrom: string;
  isFurnished: boolean;
  allowRoommates: boolean;
}

export interface EditListingValidationErrors {
  title?: string;
  price?: string;
  leasePeriod?: string;
  initialPayment?: string;
  address?: string;
  city?: string;
  images?: string;
}

export interface BankInfoDraft {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  chapaSubaccountId: string;
}

export interface BankOption {
  id: string;
  name: string;
}
