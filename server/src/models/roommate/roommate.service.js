import CustomError from "../../lib/errors.js";
import { RoommatePreferences, RoommateProfile } from "./schema.js";

const ROOMMATE_PROFILE_FIELDS = new Set([
  "profileType",
  "selectedPropertyId",
  "currentStatus",
  "occupation",
  "lifestyleType",
  "socialLevel",
  "cleanliness",
  "sleepSchedule",
  "noiseTolerance",
  "guests",
  "interactionLevel",
  "responsibility",
  "smoking",
  "drinking",
  "pets",
  "budgetMin",
  "budgetMax",
  "updatedFrom"
]);

const ROOMMATE_PROFILE_NUMBER_FIELDS = new Set([
  "socialLevel",
  "cleanliness",
  "sleepSchedule",
  "noiseTolerance",
  "guests",
  "interactionLevel",
  "responsibility",
  "budgetMin",
  "budgetMax"
]);

const ROOMMATE_PREFERENCE_FIELDS = new Set([
  "preferredCleanliness",
  "preferredSleepSchedule",
  "preferredNoiseTolerance",
  "preferredGuests",
  "preferredSocialAtmosphere",
  "preferredInteractionLevel",
  "preferredResponsibility",
  "cleanlinessWeight",
  "sleepWeight",
  "noiseWeight",
  "guestsWeight",
  "socialWeight",
  "interactionWeight",
  "responsibilityWeight",
  "smokingPolicy",
  "smokingImportance",
  "alcoholPolicy",
  "alcoholImportance",
  "petsPolicy",
  "petsImportance",
  "roommateType",
  "behaviorStrictness",
  "acceptSmoker",
  "acceptPets",
  "acceptGuests",
  "minimumStayMonths"
]);

const ROOMMATE_PREFERENCE_NUMBER_FIELDS = new Set([
  "preferredCleanliness",
  "preferredSleepSchedule",
  "preferredNoiseTolerance",
  "preferredGuests",
  "preferredSocialAtmosphere",
  "preferredInteractionLevel",
  "preferredResponsibility",
  "cleanlinessWeight",
  "sleepWeight",
  "noiseWeight",
  "guestsWeight",
  "socialWeight",
  "interactionWeight",
  "responsibilityWeight",
  "smokingImportance",
  "alcoholImportance",
  "petsImportance",
  "behaviorStrictness",
  "minimumStayMonths"
]);

const toObjectPayload = (payload) =>
  payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : {};

const toNullableValue = (value) =>
  value === null || value === "" ? null : value;

const toNumberValue = (fieldName, value, { allowNull = false } = {}) => {
  if (allowNull && (value === null || value === "")) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new CustomError(`${fieldName} must be a number`, 400);
  }

  return parsedValue;
};

const toPersistenceError = (error) => {
  if (error?.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((entry) => entry.message)
      .join(", ");

    return new CustomError(message || "Invalid roommate data", 400);
  }

  if (error?.name === "CastError") {
    return new CustomError(`Invalid ${error.path}`, 400);
  }

  return error;
};

const buildRoommateProfileUpdateSet = (payload) => {
  const input = toObjectPayload(payload);
  const updateSet = {};

  for (const field of ROOMMATE_PROFILE_FIELDS) {
    if (input[field] === undefined) {
      // Skip fields that are not present in this partial update.
    } else if (ROOMMATE_PROFILE_NUMBER_FIELDS.has(field)) {
      updateSet[field] = toNumberValue(field, input[field], {
        allowNull: field === "budgetMax"
      });
    } else if (field === "selectedPropertyId") {
      updateSet[field] = toNullableValue(input[field]);
    } else {
      updateSet[field] = input[field];
    }
  }

  if (!Object.keys(updateSet).length) {
    throw new CustomError("No valid roommate profile fields provided", 400);
  }

  return updateSet;
};

const buildRoommatePreferencesUpdateSet = (payload) => {
  const input = toObjectPayload(payload);
  const updateSet = {};

  for (const field of ROOMMATE_PREFERENCE_FIELDS) {
    if (input[field] === undefined) {
      // Skip fields that are not present in this partial update.
    } else if (ROOMMATE_PREFERENCE_NUMBER_FIELDS.has(field)) {
      updateSet[field] = toNumberValue(field, input[field]);
    } else {
      updateSet[field] = input[field];
    }
  }

  if (!Object.keys(updateSet).length) {
    throw new CustomError("No valid roommate preference fields provided", 400);
  }

  return updateSet;
};

const buildDefaultRoommateProfile = (userId) => ({
  userId,
  profileType: "TYPE_B",
  selectedPropertyId: null,
  currentStatus: "Student",
  occupation: "",
  lifestyleType: "",
  socialLevel: 3,
  cleanliness: 3,
  sleepSchedule: 3,
  noiseTolerance: 3,
  guests: 3,
  interactionLevel: 3,
  responsibility: 3,
  smoking: "no",
  drinking: "no",
  pets: "no",
  budgetMin: 0,
  budgetMax: null,
  updatedFrom: "profile"
});

const buildDefaultRoommatePreferences = (userId) => ({
  userId,
  preferredCleanliness: 3,
  preferredSleepSchedule: 3,
  preferredNoiseTolerance: 3,
  preferredGuests: 3,
  preferredSocialAtmosphere: 3,
  preferredInteractionLevel: 3,
  preferredResponsibility: 3,
  cleanlinessWeight: 3,
  sleepWeight: 3,
  noiseWeight: 3,
  guestsWeight: 3,
  socialWeight: 3,
  interactionWeight: 3,
  responsibilityWeight: 3,
  smokingPolicy: "not-allowed",
  smokingImportance: 3,
  alcoholPolicy: "occasionally",
  alcoholImportance: 3,
  petsPolicy: "not-allowed",
  petsImportance: 3,
  roommateType: "Balanced",
  behaviorStrictness: 3,
  acceptSmoker: "no",
  acceptPets: "no",
  acceptGuests: "no",
  minimumStayMonths: 1
});

export const getRoommateProfileByUserId = async (userId) => {
  const profile = await RoommateProfile.findOne({ userId }).lean();
  return profile ?? null;
};

export const updateRoommateProfileByUserId = async ({ userId, payload }) => {
  const updateSet = buildRoommateProfileUpdateSet(payload);
  const existingProfile = await RoommateProfile.findOne({ userId })
    .select({ budgetMin: 1, budgetMax: 1 })
    .lean();

  const resolvedBudgetMin =
    updateSet.budgetMin ?? existingProfile?.budgetMin ?? 0;
  const resolvedBudgetMax =
    updateSet.budgetMax !== undefined
      ? updateSet.budgetMax
      : (existingProfile?.budgetMax ?? null);

  if (resolvedBudgetMax !== null && resolvedBudgetMax < resolvedBudgetMin) {
    throw new CustomError(
      "budgetMax must be null or greater than or equal to budgetMin",
      400
    );
  }

  try {
    const profile = await RoommateProfile.findOneAndUpdate(
      { userId },
      {
        $set: updateSet,
        $setOnInsert: { userId }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    if (!profile) {
      throw new CustomError("Unable to update roommate profile", 500);
    }

    return profile;
  } catch (error) {
    throw toPersistenceError(error);
  }
};

export const getRoommatePreferencesByUserId = async (userId) => {
  const preferences = await RoommatePreferences.findOne({ userId }).lean();

  return preferences || buildDefaultRoommatePreferences(userId);
};

export const updateRoommatePreferencesByUserId = async ({
  userId,
  payload
}) => {
  const updateSet = buildRoommatePreferencesUpdateSet(payload);

  try {
    const preferences = await RoommatePreferences.findOneAndUpdate(
      { userId },
      {
        $set: updateSet,
        $setOnInsert: { userId }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    if (!preferences) {
      throw new CustomError("Unable to update roommate preferences", 500);
    }

    return preferences;
  } catch (error) {
    throw toPersistenceError(error);
  }
};
