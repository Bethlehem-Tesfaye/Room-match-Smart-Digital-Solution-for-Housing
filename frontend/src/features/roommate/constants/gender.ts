export const ROOMMATE_GENDERS = ["male", "female"] as const;

export type RoommateGender = (typeof ROOMMATE_GENDERS)[number];

export const PREFERRED_ROOMMATE_GENDERS = ["any", "male", "female"] as const;

export type PreferredRoommateGender =
  (typeof PREFERRED_ROOMMATE_GENDERS)[number];

export const ROOMMATE_GENDER_LABELS: Record<RoommateGender, string> = {
  male: "Male",
  female: "Female",
};

export const PREFERRED_ROOMMATE_GENDER_LABELS: Record<
  PreferredRoommateGender,
  string
> = {
  any: "Any",
  male: "Male only",
  female: "Female only",
};
