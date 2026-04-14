export const calculateRoommateMatch = (user1, user2) => {
  // ========================================
  // HARD FILTERS - Return 0 if any fail
  // ========================================

  // 1. Smoking
  if (user1.smoking === "no" && user2.smoking === "yes") {
    return 0;
  }

  // 2. Pets
  if (user1.pets === "no" && user2.pets === "yes") {
    return 0;
  }

  // 3. Drinking - both must be 'no' or both 'yes' (or 'sometimes' compatible with 'no')
  if (user1.drinking === "no" && user2.drinking === "yes") {
    return 0;
  }
  if (user1.drinking === "yes" && user2.drinking === "no") {
    return 0;
  }

  // 4. Budget - budgets must overlap
  const budgetMin1 = user1.budgetMin ?? 0;
  const budgetMax1 = user1.budgetMax ?? 2000;
  const budgetMin2 = user2.budgetMin ?? 0;
  const budgetMax2 = user2.budgetMax ?? 2000;
  const budgetOverlap = !(budgetMax1 < budgetMin2 || budgetMax2 < budgetMin1);
  if (!budgetOverlap) {
    return 0;
  }

  // 5. Location - must share at least one preferred location
  const locations1 = user1.preferredLocations || [];
  const locations2 = user2.preferredLocations || [];
  const hasCommonLocation = locations1.some((loc) => locations2.includes(loc));
  if (locations1.length > 0 && locations2.length > 0 && !hasCommonLocation) {
    return 0;
  }

  // 6. Move-in date - must be within 2 weeks (14 days)
  const moveIn1 = user1.moveInDate ? new Date(user1.moveInDate) : null;
  const moveIn2 = user2.moveInDate ? new Date(user2.moveInDate) : null;
  if (moveIn1 && moveIn2) {
    const daysDiff = Math.abs(moveIn1 - moveIn2) / (1000 * 60 * 60 * 24);
    if (daysDiff > 14) {
      return 0;
    }
  }

  // ========================================
  // SOFT FILTERS - Weighted scoring
  // ========================================

  const weights = {
    cleanliness: 0.2,
    sleepSchedule: 0.15,
    noiseTolerance: 0.12,
    guests: 0.12,
    studyHabits: 0.1,
    temperature: 0.08,
    personality: 0.08,
    stayDuration: 0.05,
    occupation: 0.05,
    interests: 0.05
  };

  let score = 0;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (totalWeight === 0) return 0;

  // Cleanliness (1-5)
  let val1 = user1.cleanliness ?? 3;
  let val2 = user2.cleanliness ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const cleanlinessDiff = Math.abs(val1 - val2) / 4;
  score += (1 - cleanlinessDiff) * 100 * weights.cleanliness;

  // Sleep Schedule (1-5)
  val1 = user1.sleepSchedule ?? 3;
  val2 = user2.sleepSchedule ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const sleepDiff = Math.abs(val1 - val2) / 4;
  score += (1 - sleepDiff) * 100 * weights.sleepSchedule;

  // Noise Tolerance (1-5)
  val1 = user1.noiseTolerance ?? 3;
  val2 = user2.noiseTolerance ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const noiseDiff = Math.abs(val1 - val2) / 4;
  score += (1 - noiseDiff) * 100 * weights.noiseTolerance;

  // Guests (1-5)
  val1 = user1.guests ?? 3;
  val2 = user2.guests ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const guestsDiff = Math.abs(val1 - val2) / 4;
  score += (1 - guestsDiff) * 100 * weights.guests;

  // Study Habits (1-5)
  val1 = user1.studyHabits ?? 3;
  val2 = user2.studyHabits ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const studyDiff = Math.abs(val1 - val2) / 4;
  score += (1 - studyDiff) * 100 * weights.studyHabits;

  // Temperature (1-5)
  val1 = user1.temperature ?? 3;
  val2 = user2.temperature ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const tempDiff = Math.abs(val1 - val2) / 4;
  score += (1 - tempDiff) * 100 * weights.temperature;

  // Personality (1-5)
  val1 = user1.personality ?? 3;
  val2 = user2.personality ?? 3;
  val1 = Math.min(5, Math.max(1, val1));
  val2 = Math.min(5, Math.max(1, val2));
  const personalityDiff = Math.abs(val1 - val2) / 4;
  score += (1 - personalityDiff) * 100 * weights.personality;

  // Stay Duration (1-60 months)
  const duration1 = user1.stayDurationMonths ?? 12;
  const duration2 = user2.stayDurationMonths ?? 12;
  const durationDiff = Math.abs(duration1 - duration2) / 60;
  score += (1 - durationDiff) * 100 * weights.stayDuration;

  // Occupation match (student, working, remote, hybrid, unemployed)
  const occupation1 = user1.occupation ?? "student";
  const occupation2 = user2.occupation ?? "student";
  const occupationMatch = occupation1 === occupation2 ? 100 : 50;
  score += occupationMatch * weights.occupation;

  // Interests overlap
  const interests1 = user1.interests || [];
  const interests2 = user2.interests || [];
  if (interests1.length > 0 && interests2.length > 0) {
    const commonInterests = interests1.filter((i) => interests2.includes(i));
    const interestScore =
      (commonInterests.length /
        Math.max(interests1.length, interests2.length)) *
      100;
    score += interestScore * weights.interests;
  } else {
    score += 50 * weights.interests; // Neutral if no interests listed
  }

  return Math.round((score / totalWeight) * 100) / 100;
};
