import type { AddListingDraft, AddListingStepMeta } from "../types/types";

export const addListingSteps: AddListingStepMeta[] = [
  { id: 1, title: "Property Details" },
  { id: 2, title: "Location" },
  { id: 3, title: "Photos" },
  { id: 4, title: "Amenities & Final Details" },
];

export const propertyTypeOptions = [
  "Apartment",
  "House",
  "Condo",
  "Studio",
  "SharedRoom",
] as const;

export const currencyOptions = ["ETB", "USD", "EUR"];

export const initialAddListingDraft: AddListingDraft = {
  title: "",
  description: "",
  propertyType: "Apartment",
  price: "",
  currency: "ETB",
  deposit: "0",
  numberOfBedrooms: "0",
  numberOfBathrooms: "0",
  floorNumber: "",
  totalFloors: "",
  areaSqFt: "",
  address: "",
  city: "",
  images: [],
  amenityIds: [],
  availableFrom: "",
  isFurnished: false,
};
