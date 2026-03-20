import type {
  CreatePropertyInput,
  Property,
  PropertyType,
  UpdatePropertyInput,
} from "../../property/types/type";

export type CreatorProperty = Property;

export type CreateCreatorPropertyInput = CreatePropertyInput;

export type UpdateCreatorPropertyInput = UpdatePropertyInput;

export interface CreatorPropertyByIdResponse {
  property: CreatorProperty;
}

export interface CreatorPropertyListResponse {
  properties: CreatorProperty[];
}

export interface CreatorUpdatePropertyResponse {
  message: string;
  property: CreatorProperty;
}

export interface CreatorDeletePropertyResponse {
  message: string;
}

export type AddListingStep = 1 | 2 | 3 | 4;

export interface AddListingImageDraft {
  id: string;
  imageBase64: string;
  isPrimary: boolean;
}

export interface AddListingDraft {
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
  images: AddListingImageDraft[];
  amenityIds: string[];
  availableFrom: string;
  isFurnished: boolean;
}

export type SetAddListingField = <K extends keyof AddListingDraft>(
  key: K,
  value: AddListingDraft[K],
) => void;

export interface AddListingStepMeta {
  id: AddListingStep;
  title: string;
}

export type CreateListingPayload = CreateCreatorPropertyInput;
