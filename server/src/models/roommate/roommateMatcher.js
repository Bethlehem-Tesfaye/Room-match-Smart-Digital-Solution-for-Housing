const clampRating = (value, fallback = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, n));
};

const getWeight = (preferences, key, fallback = 3) => {
  return clampRating(preferences?.[key], fallback);
};

// 1 - distance normalized to 0..1
const scoreDifference = (a, b) => {
  const x = clampRating(a);
  const y = clampRating(b);
  return 1 - Math.abs(x - y) / 4;
};

const normalizeBudgetRange = (profile = {}) => ({
  min: Number.isFinite(Number(profile.budgetMin))
    ? Number(profile.budgetMin)
    : 0,
  max:
    profile.budgetMax == null || profile.budgetMax === ""
      ? Infinity
      : Number.isFinite(Number(profile.budgetMax))
        ? Number(profile.budgetMax)
        : Infinity
});

const budgetOverlap = (a, b) => {
  const aMax = a.max ?? Infinity;
  const bMax = b.max ?? Infinity;
  return a.min <= bMax && b.min <= aMax;
};

const matchesGenderPreference = (preferences, targetProfile) => {
  const preferred = preferences?.preferredRoommateGender ?? "any";
  if (preferred === "any") return true;

  const targetGender = targetProfile?.gender;
  if (targetGender !== "male" && targetGender !== "female") {
    return true;
  }

  return targetGender === preferred;
};

// -----------------------------
// HARD FILTERS
// -----------------------------
const applyHardFilters = ({ targetProfile, preferences, propertyContext }) => {
  if (!matchesGenderPreference(preferences, targetProfile)) return false;

  // smoking / pets / guests hard constraints
  if (preferences.acceptSmoker === "no" && targetProfile.smoking === "yes")
    return false;

  if (preferences.acceptPets === "no" && targetProfile.pets === "yes")
    return false;

  if (
    preferences.acceptGuests === "no" &&
    Number(targetProfile.guests ?? 3) > Number(preferences.preferredGuests ?? 3)
  ) {
    return false;
  }

  // budget check (viewer profile vs target profile)
  const targetBudget = normalizeBudgetRange(targetProfile);
  const viewerProfile = propertyContext?.profile;
  if (viewerProfile) {
    const userBudget = normalizeBudgetRange(viewerProfile);
    if (!budgetOverlap(userBudget, targetBudget)) return false;
  }

  // smoking policy compatibility (soft constraint)
  const smokingPolicy = preferences.smokingPolicy;
  if (smokingPolicy === "not-allowed" && targetProfile.smoking === "yes")
    return false;

  // pets policy
  const petsPolicy = preferences.petsPolicy;
  if (petsPolicy === "not-allowed" && targetProfile.pets === "yes")
    return false;

  return true;
};

// -----------------------------
// MAIN MATCH FUNCTION
// -----------------------------
export const calculateRoommateMatch = ({
  currentProfile, // viewer (user A)
  targetProfile, // user B
  preferences = {}, // user A preferences
  propertyContext = null
}) => {
  if (!currentProfile || !targetProfile) return 0;

  const passed = applyHardFilters({
    targetProfile,
    preferences,
    propertyContext
  });

  if (!passed) return 0;

  // -----------------------------
  // WEIGHTS (from preferences)
  // -----------------------------
  const weights = {
    cleanliness: getWeight(preferences, "cleanlinessWeight"),
    sleep: getWeight(preferences, "sleepWeight"),
    noise: getWeight(preferences, "noiseWeight"),
    guests: getWeight(preferences, "guestsWeight"),
    social: getWeight(preferences, "socialWeight"),
    interaction: getWeight(preferences, "interactionWeight"),
    responsibility: getWeight(preferences, "responsibilityWeight")
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // -----------------------------
  // SCORE FEATURES (PROFILE vs PREFERENCES)
  // -----------------------------

  const cleanliness =
    scoreDifference(
      targetProfile.cleanliness,
      preferences.preferredCleanliness
    ) * weights.cleanliness;

  const sleep =
    scoreDifference(
      targetProfile.sleepSchedule,
      preferences.preferredSleepSchedule
    ) * weights.sleep;

  const noise =
    scoreDifference(
      targetProfile.noiseTolerance,
      preferences.preferredNoiseTolerance
    ) * weights.noise;

  const guests =
    scoreDifference(targetProfile.guests, preferences.preferredGuests) *
    weights.guests;

  const social =
    scoreDifference(
      targetProfile.socialLevel,
      preferences.preferredSocialAtmosphere
    ) * weights.social;

  const interaction =
    scoreDifference(
      targetProfile.interactionLevel,
      preferences.preferredInteractionLevel
    ) * weights.interaction;

  const responsibility =
    scoreDifference(
      targetProfile.responsibility,
      preferences.preferredResponsibility
    ) * weights.responsibility;

  // -----------------------------
  // POLICY SCORING (soft compatibility)
  // -----------------------------
  const smokingPolicyScore = scoreDifference(
    targetProfile.smoking === "yes" ? 5 : 1,
    preferences.smokingPolicy === "allowed" ? 5 : 1
  );

  const alcoholPolicyScore = scoreDifference(
    targetProfile.drinking === "yes"
      ? 5
      : targetProfile.drinking === "sometimes"
        ? 3
        : 1,
    preferences.alcoholPolicy === "allowed"
      ? 5
      : preferences.alcoholPolicy === "occasionally"
        ? 3
        : 1
  );

  const petsPolicyScore = scoreDifference(
    targetProfile.pets === "yes" ? 5 : 1,
    preferences.petsPolicy === "allowed" ? 5 : 1
  );

  const policyWeight = 2;

  const rawScore =
    cleanliness +
    sleep +
    noise +
    guests +
    social +
    interaction +
    responsibility +
    smokingPolicyScore * policyWeight +
    alcoholPolicyScore * policyWeight +
    petsPolicyScore * policyWeight;

  const finalScore = (rawScore / (totalWeight + policyWeight * 3)) * 100;

  return Math.round(finalScore * 100) / 100;
};
