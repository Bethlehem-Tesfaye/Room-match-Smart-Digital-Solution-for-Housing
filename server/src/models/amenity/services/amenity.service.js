import { Amenity } from "../schema.js";

export const listAmenities = async ({ category }) => {
  const filter = category ? { category } : {};

  const amenities = await Amenity.find(filter)
    .sort({ category: 1, name: 1 })
    .lean();

  return amenities;
};
