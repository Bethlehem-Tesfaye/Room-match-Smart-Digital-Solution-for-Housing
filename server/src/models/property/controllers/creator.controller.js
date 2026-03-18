import * as propertyService from "../services/creator.service.js";

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
    const properties = await propertyService.getMyProperties(req.userId);
    return res.status(200).json({ properties });
  } catch (err) {
    return next(err);
  }
};
