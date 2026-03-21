import * as amenityService from "../services/amenity.service.js";

export const listAmenitiesHandler = async (req, res, next) => {
  try {
    const amenities = await amenityService.listAmenities({
      category: req.query.category
    });

    return res.status(200).json({ amenities });
  } catch (err) {
    return next(err);
  }
};
