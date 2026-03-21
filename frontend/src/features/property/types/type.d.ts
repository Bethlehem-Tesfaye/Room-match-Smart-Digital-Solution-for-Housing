export type PropertyType =
  | "Apartment"
  | "House"
  | "Condo"
  | "Studio"
  | "SharedRoom";

export type PropertyStatus = "Active" | "Rented" | "Inactive";
export type PropertyCountFilter = "Any" | "1" | "2" | "3" | "4" | "5+";

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

export interface PropertyOwner {
  _id: string;
  name: string;
  email: string;
  image: string;
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
  amenities?: Amenity[];
  owner?: PropertyOwner | null;
  isSaved?: boolean;
  favoriteId?: string;
  savedAt?: string;
  favoriteNotes?: string;
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

  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: Exclude<PropertyCountFilter, "Any"> | number;
  bathrooms?: Exclude<PropertyCountFilter, "Any"> | number;
  amenities?: string[];
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

export type SavedPropertiesResponse = BrowserPropertiesResponse;

export interface Amenity {
  _id: string;
  name: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}
