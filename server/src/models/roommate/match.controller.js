import { generateMatchesForUser, getMatchesForUser } from "./match.service.js";

export const generateMyMatches = async (req, res, next) => {
  try {
    const matches = await generateMatchesForUser(req.userId);

    return res.status(200).json({
      message: "Matches generated successfully",
      count: matches.length
    });
  } catch (err) {
    next(err);
  }
};

export const getMyMatches = async (req, res, next) => {
  try {
    const matches = await getMatchesForUser(req.userId);

    return res.status(200).json({ matches });
  } catch (err) {
    next(err);
  }
};
