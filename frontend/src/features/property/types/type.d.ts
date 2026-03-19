export type PropertyType =
  | "Apartment"
  | "House"
  | "Condo"
  | "Studio"
  | "SharedRoom";

export type PropertyStatus = "Active" | "Rented" | "Inactive";

export interface PropertyImageInput {
  imageUrl?: string;
  imageBase64?: string;
  isPrimary?: boolean;
}

export interface PropertyImage {
  _id: string;
  imageUrl: string;
  isPrimary: boolean;
  uploadDate: string;
}

export interface Property {
  _id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  price: number;
  currency: string;
  deposit: number;
  address: string;
  city: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  floorNumber: number | null;
  totalFloors: number | null;
  areaSqFt: number | null;
  isFurnished: boolean;
  availableFrom: string | null;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  images: PropertyImage[];
  amenityIds: string[];
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  propertyType: PropertyType;
  price: number;
  currency?: string;
  deposit?: number;
  address: string;
  city: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  floorNumber?: number | null;
  totalFloors?: number | null;
  areaSqFt?: number | null;
  isFurnished?: boolean;
  availableFrom?: string | null;
  status?: PropertyStatus;
  images?: PropertyImageInput[];
  amenityIds?: string[];
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export interface SaveFavoriteInput {
  propertyId: string;
  notes?: string;
}

export interface BrowsePropertiesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BrowserPropertiesResponse {
  properties: Property[];
  pagination: PaginationMeta;
}

export interface Amenity {
  _id: string;
  name: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}
