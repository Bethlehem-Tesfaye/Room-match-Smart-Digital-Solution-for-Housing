export const calculateRoommateMatch = (user1, user2) => {
  const weights = {
    cleanliness: 0.25,
    sleepSchedule: 0.2,
    noiseTolerance: 0.15,
    guests: 0.15,
    studyHabits: 0.1,
    temperature: 0.08,
    personality: 0.07
  };

  // Hard filters - immediate reject if incompatible
  if (
    (user1.smoking === "no" && user2.smoking === "yes") ||
    (user1.pets === "no" && user2.pets === "yes")
  ) {
    return 0;
  }

  let score = 0;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (totalWeight === 0) return 0;

  Object.keys(weights).forEach((key) => {
    let val1 = user1[key];
    let val2 = user2[key];

    // Default to 3 if missing
    if (val1 === undefined || val1 === null) val1 = 3;
    if (val2 === undefined || val2 === null) val2 = 3;

    // Clamp to 1-5 range
    val1 = Math.min(5, Math.max(1, val1));
    val2 = Math.min(5, Math.max(1, val2));

    const diff = Math.abs(val1 - val2) / 4;
    const similarity = (1 - diff) * 100;
    score += similarity * weights[key];
  });

  return Math.round((score / totalWeight) * 100) / 100;
};
