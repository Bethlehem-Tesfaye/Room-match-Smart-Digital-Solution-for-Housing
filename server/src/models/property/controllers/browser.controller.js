import * as browserService from "../services/browser.service.js";
import { browsePropertyQuerySchema } from "../validation.js";

export const listBrowserPropertiesHandler = async (req, res, next) => {
  try {
    const { page, limit, search } = browsePropertyQuerySchema.parse(req.query);
    const result = await browserService.listBrowserProperties({
      page,
      limit,
      search
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

export const getBrowserPropertyDetailsHandler = async (req, res, next) => {
  try {
    const property = await browserService.getBrowserPropertyDetails(
      req.params.id
    );
    return res.status(200).json({ property });
  } catch (err) {
    return next(err);
  }
};

export const savePropertyToFavoriteHandler = async (req, res, next) => {
  try {
    const favorite = await browserService.savePropertyToFavorite({
      userId: req.userId,
      propertyId: req.params.id,
      notes: req.body?.notes
    });

    return res.status(200).json({
      message: "Property saved to favorites",
      favorite
    });
  } catch (err) {
    return next(err);
  }
};

export const removePropertyFromFavoriteHandler = async (req, res, next) => {
  try {
    await browserService.removePropertyFromFavorite({
      userId: req.userId,
      propertyId: req.params.id
    });

    return res.status(200).json({
      message: "Property removed from favorites"
    });
  } catch (err) {
    return next(err);
  }
};
