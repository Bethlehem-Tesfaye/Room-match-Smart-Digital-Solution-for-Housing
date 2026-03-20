import * as propertyService from "../services/creator.service.js";
import { browsePropertyQuerySchema } from "../validation.js";

export const createPropertyHandler = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty({
      userId: req.userId,
      payload: req.body
    });

    return res.status(201).json({ property });
  } catch (err) {
    return next(err);
  }
};

export const getPropertyByIdHandler = async (req, res, next) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    return res.status(200).json({ property });
  } catch (err) {
    return next(err);
  }
};

export const updatePropertyHandler = async (req, res, next) => {
  try {
    const property = await propertyService.updatePropertyById({
      propertyId: req.params.id,
      userId: req.userId,
      payload: req.body
    });

    return res.status(200).json({ message: "Property updated", property });
  } catch (err) {
    return next(err);
  }
};

export const deletePropertyHandler = async (req, res, next) => {
  try {
    await propertyService.deletePropertyById({
      propertyId: req.params.id,
      userId: req.userId
    });

    return res.status(200).json({ message: "Property deleted" });
  } catch (err) {
    return next(err);
  }
};

export const listMyPropertiesHandler = async (req, res, next) => {
  try {
    const { page, limit, search } = browsePropertyQuerySchema.parse(req.query);
    const result = await propertyService.getMyProperties({
      userId: req.userId,
      page,
      limit,
      search
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

export const getMyListingCountsHandler = async (req, res, next) => {
  try {
    const counts = await propertyService.getMyListingCounts(req.userId);
    return res.status(200).json({ counts });
  } catch (err) {
    return next(err);
  }
};
