import React from "react";
import { Sparkles, UserRound, Wallet } from "lucide-react";
import type { RoommateFormData } from "../hooks/useRoommateData";

interface Props {
  preferences: RoommateFormData | null;
  onUpdate: (
    field: keyof RoommateFormData,
    value: string | number | string[] | null,
  ) => void;
  loading?: boolean;
  variant?: "profile" | "preferences";
}

const sliderFill = (value: number, min: number, max: number) => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 1;
  const safeValue = Math.min(Math.max(value, safeMin), safeMax);
  const progress = ((safeValue - safeMin) / (safeMax - safeMin)) * 100;
  return `linear-gradient(to right, var(--palette-light-purple) 0%, var(--palette-purple) ${progress}%, var(--palette-card-muted-bg) ${progress}%, var(--palette-card-muted-bg) 100%)`;
};

type CurrentStatus = "Student" | "Employed" | "Self-employed" | "Other";
type Lifestyle = "Structured" | "Balanced" | "Relaxed" | "Flexible";

type PreferenceScaleField =
  | "cleanliness"
  | "sleepSchedule"
  | "noiseTolerance"
  | "guests"
  | "personality"
  | "studyHabits";

type ImportanceStateKey =
  | "cleanlinessImportance"
  | "sleepScheduleImportance"
  | "noiseToleranceImportance"
  | "guestsImportance"
  | "socialAtmosphereImportance"
  | "interactionImportance"
  | "smokingImportance"
  | "alcoholImportance"
  | "petsImportance";

type PolicySelection =
  | "not-allowed"
  | "allowed"
  | "outside-only"
  | "occasionally"
  | "depends";
type YesNo = "yes" | "no";
type FitChoice =
  | "Very similar"
  | "Somewhat similar"
  | "Balanced"
  | "Different is fine";
type StayDurationChoice = "1 month" | "3 months" | "6 months" | "12 months";

const toStayDurationChoice = (
  minimumStayMonths?: number,
): StayDurationChoice => {
  if ((minimumStayMonths ?? 1) >= 12) return "12 months";
  if ((minimumStayMonths ?? 1) >= 6) return "6 months";
  if ((minimumStayMonths ?? 1) >= 3) return "3 months";
  return "1 month";
};

const toLifestyle = (value?: string): Lifestyle => {
  if (
    value === "Structured" ||
    value === "Balanced" ||
    value === "Relaxed" ||
    value === "Flexible"
  ) {
    return value;
  }

  return "Balanced";
};

const preferenceScaleQuestions: Array<{
  field: PreferenceScaleField;
  label: string;
  leftLabel: string;
  rightLabel: string;
  importanceKey: Exclude<
    ImportanceStateKey,
    "smokingImportance" | "alcoholImportance" | "petsImportance"
  >;
}> = [
  {
    field: "cleanliness",
    label: "1) Preferred roommate cleanliness",
    leftLabel: "Messy",
    rightLabel: "Very tidy",
    importanceKey: "cleanlinessImportance",
  },
  {
    field: "sleepSchedule",
    label: "2) Preferred sleep schedule compatibility",
    leftLabel: "Early sleeper",
    rightLabel: "Night owl",
    importanceKey: "sleepScheduleImportance",
  },
  {
    field: "noiseTolerance",
    label: "3) Preferred noise level at home",
    leftLabel: "Very quiet",
    rightLabel: "Flexible/noisy ok",
    importanceKey: "noiseToleranceImportance",
  },
  {
    field: "guests",
    label: "4) Guest frequency preference",
    leftLabel: "No guests",
    rightLabel: "Frequent guests",
    importanceKey: "guestsImportance",
  },
  {
    field: "personality",
    label: "5) Preferred social atmosphere",
    leftLabel: "Very private",
    rightLabel: "Very social",
    importanceKey: "socialAtmosphereImportance",
  },
  {
    field: "studyHabits",
    label: "6) Shared interaction level",
    leftLabel: "Independent living",
    rightLabel: "Highly interactive home",
    importanceKey: "interactionImportance",
  },
];

const profileSliderQuestions = [
  {
    key: "socialLevel" as const,
    label: "How social are you at home?",
    leftLabel: "Very private",
    rightLabel: "Very social",
  },
  {
    key: "cleanliness" as const,
    label: "How tidy are you in shared spaces?",
    leftLabel: "Messy",
    rightLabel: "Very tidy",
  },
  {
    key: "sleepSchedule" as const,
    label: "What is your typical sleep schedule?",
    leftLabel: "Early sleeper",
    rightLabel: "Night owl",
  },
  {
    key: "noiseTolerance" as const,
    label: "How sensitive are you to noise at home?",
    leftLabel: "Need silence",
    rightLabel: "Very flexible",
  },
  {
    key: "guests" as const,
    label: "How often do you have guests over?",
    leftLabel: "Never",
    rightLabel: "Very often",
  },
  {
    key: "interactionLevel" as const,
    label: "How do you behave in shared spaces?",
    leftLabel: "Independent, minimal interaction",
    rightLabel: "Highly interactive",
  },
  {
    key: "responsibility" as const,
    label: "How do you handle shared responsibilities (cleaning, etc.)?",
    leftLabel: "Rarely participate",
    rightLabel: "Always proactive",
  },
] as const;

export const RoommatePreferences: React.FC<Props> = ({
  preferences,
  onUpdate,
  loading,
  variant = "profile",
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 text-center text-(--palette-soft-purple)">
        Loading preferences...
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 text-center text-red-500">
        Failed to load preferences
      </div>
    );
  }

  const currentStatus = preferences.currentStatus ?? "Student";
  const occupationField = preferences.occupation ?? "";
  const lifestyle = toLifestyle(preferences.lifestyleType);
  const socialLevel = preferences.socialLevel ?? preferences.personality ?? 3;
  const tidyLevel = preferences.cleanliness || 3;
  const sleepLevel = preferences.sleepSchedule || 3;
  const noiseLevel = preferences.noiseTolerance || 3;
  const guestLevel = preferences.guests || 3;
  const sharedSpaceLevel =
    preferences.interactionLevel ?? preferences.studyHabits ?? 3;
  const responsibilityLevel =
    preferences.responsibility ?? preferences.temperature ?? 3;
  const preferenceDraft: Record<ImportanceStateKey, number> & {
    smokingPolicy: PolicySelection;
    alcoholPolicy: PolicySelection;
    petsPolicy: PolicySelection;
    roommateType: FitChoice;
    behaviorStrictness: number;
    acceptSmoker: YesNo;
    acceptPets: YesNo;
    acceptGuests: YesNo;
    minimumStay: StayDurationChoice;
  } = {
    cleanlinessImportance: preferences.cleanlinessWeight ?? 3,
    sleepScheduleImportance: preferences.sleepWeight ?? 3,
    noiseToleranceImportance: preferences.noiseWeight ?? 3,
    guestsImportance: preferences.guestsWeight ?? 3,
    socialAtmosphereImportance: preferences.socialWeight ?? 3,
    interactionImportance: preferences.interactionWeight ?? 3,
    smokingImportance: preferences.smokingImportance ?? 3,
    alcoholImportance: preferences.alcoholImportance ?? 3,
    petsImportance: preferences.petsImportance ?? 3,
    smokingPolicy: preferences.smokingPolicy ?? "not-allowed",
    alcoholPolicy: preferences.alcoholPolicy ?? "occasionally",
    petsPolicy: preferences.petsPolicy ?? "not-allowed",
    roommateType: (preferences.roommateType as FitChoice) ?? "Balanced",
    behaviorStrictness: preferences.behaviorStrictness ?? 3,
    acceptSmoker: preferences.acceptSmoker ?? "no",
    acceptPets: preferences.acceptPets ?? "no",
    acceptGuests: preferences.acceptGuests ?? "no",
    minimumStay: toStayDurationChoice(preferences.minimumStayMonths),
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto rounded-[28px]  bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
      <div className="space-y-6">
        {variant === "profile" ? (
          <>
            <section className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-(--palette-deep)">
                <Sparkles className="h-4 w-4 text-(--palette-purple)" />
                <h3 className="text-lg font-semibold">
                  YOUR PROFILE (Tell us about yourself)
                </h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    1) What is your current status?
                  </label>
                  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          "Student",
                          "Employed",
                          "Self-employed",
                          "Other",
                        ] as CurrentStatus[]
                      ).map((option) => {
                        const active = currentStatus === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              onUpdate("currentStatus", option);
                            }}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                                : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    2) What is your occupation or field of study?
                  </label>
                  <input
                    type="text"
                    value={occupationField}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      onUpdate("occupation", nextValue);
                    }}
                    placeholder="Short text input"
                    className="w-full rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none placeholder:text-(--palette-soft-purple)"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    3) How would you describe your general lifestyle?
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5 sm:grid-cols-4">
                    {(
                      [
                        "Structured",
                        "Balanced",
                        "Relaxed",
                        "Flexible",
                      ] as Lifestyle[]
                    ).map((option) => {
                      const active = lifestyle === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            onUpdate("lifestyleType", option);
                          }}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                              : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                {profileSliderQuestions.map((item) => {
                  const valueMap: Record<typeof item.key, number> = {
                    socialLevel,
                    cleanliness: tidyLevel,
                    sleepSchedule: sleepLevel,
                    noiseTolerance: noiseLevel,
                    guests: guestLevel,
                    interactionLevel: sharedSpaceLevel,
                    responsibility: responsibilityLevel,
                  };

                  const value = valueMap[item.key];
                  const handleChange = (nextValue: number) => {
                    if (item.key === "socialLevel") {
                      onUpdate("socialLevel", nextValue);
                      return;
                    }

                    if (item.key === "cleanliness") {
                      onUpdate("cleanliness", nextValue);
                      return;
                    }

                    if (item.key === "sleepSchedule") {
                      onUpdate("sleepSchedule", nextValue);
                      return;
                    }

                    if (item.key === "noiseTolerance") {
                      onUpdate("noiseTolerance", nextValue);
                      return;
                    }

                    if (item.key === "guests") {
                      onUpdate("guests", nextValue);
                      return;
                    }

                    if (item.key === "interactionLevel") {
                      onUpdate("interactionLevel", nextValue);
                      return;
                    }

                    onUpdate("responsibility", nextValue);
                  };

                  return (
                    <div key={item.key}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                          {item.label}
                        </label>
                        <span className="text-sm font-semibold text-(--palette-purple)">
                          {value}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={value}
                        onChange={(event) =>
                          handleChange(Number(event.target.value))
                        }
                        className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
                        style={{ background: sliderFill(value, 1, 5) }}
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-(--palette-soft-purple)">
                        <span>{item.leftLabel}</span>
                        <span>{item.rightLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    11) Do you smoke?
                  </label>
                  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["no", "yes"] as const).map((option) => {
                        const active = preferences.smoking === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => onUpdate("smoking", option)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                                : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                            }`}
                          >
                            {option === "no" ? "No" : "Yes"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    13) Do you have pets?
                  </label>
                  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["no", "yes"] as const).map((option) => {
                        const active = preferences.pets === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => onUpdate("pets", option)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                                : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                            }`}
                          >
                            {option === "no" ? "No" : "Yes"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    12) Do you drink alcohol?
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5">
                    {(
                      [
                        ["no", "No"],
                        ["sometimes", "Occasionally"],
                        ["yes", "Yes"],
                      ] as const
                    ).map(([value, label]) => {
                      const active = preferences.drinking === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => onUpdate("drinking", value)}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                              : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-(--palette-deep)">
                <Wallet className="h-4 w-4 text-(--palette-purple)" />
                <h3 className="text-lg font-semibold">
                  14) What is your monthly budget range?
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    Minimum budget
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      Number.isFinite(preferences.budgetMin)
                        ? preferences.budgetMin
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdate(
                        "budgetMin",
                        value === "" ? Number.NaN : Number(value),
                      );
                    }}
                    className="w-full rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    Maximum budget
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={preferences.budgetMax ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdate(
                        "budgetMax",
                        value === "" ? Number.NaN : Number(value),
                      );
                    }}
                    className="w-full rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none"
                  />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {variant === "preferences" ? (
          <>
            <section className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-(--palette-deep)">
                <Sparkles className="h-4 w-4 text-(--palette-purple)" />
                <h3 className="text-lg font-semibold">
                  ROOMMATE PREFERENCES (What are you looking for?)
                </h3>
              </div>

              <div className="grid gap-4">
                {preferenceScaleQuestions.map((question) => {
                  const preferenceFieldMap = {
                    cleanliness: "preferredCleanliness",
                    sleepSchedule: "preferredSleepSchedule",
                    noiseTolerance: "preferredNoiseTolerance",
                    guests: "preferredGuests",
                    personality: "preferredSocialAtmosphere",
                    studyHabits: "preferredInteractionLevel",
                  } as const;

                  const importance = preferenceDraft[question.importanceKey];
                  const currentValue =
                    (preferences[preferenceFieldMap[question.field]] as
                      | number
                      | undefined) ?? 3;

                  const importanceFieldMap = {
                    cleanlinessImportance: "cleanlinessWeight",
                    sleepScheduleImportance: "sleepWeight",
                    noiseToleranceImportance: "noiseWeight",
                    guestsImportance: "guestsWeight",
                    socialAtmosphereImportance: "socialWeight",
                    interactionImportance: "interactionWeight",
                  } as const;

                  return (
                    <div
                      key={question.field}
                      className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-(--palette-deep)">
                            {question.label}
                          </p>
                          <p className="mt-1 text-xs text-(--palette-soft-purple)">
                            Scale 1 to 5
                          </p>
                        </div>
                        <span className="rounded-full bg-(--palette-chip-bg) px-3 py-1 text-xs font-semibold text-(--palette-purple)">
                          Importance {importance}
                        </span>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-(--palette-soft-purple)">
                            <span>Scale</span>
                            <span>{currentValue}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={currentValue}
                            onChange={(event) =>
                              onUpdate(
                                preferenceFieldMap[question.field],
                                Number(event.target.value),
                              )
                            }
                            className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
                            style={{
                              background: sliderFill(currentValue, 1, 5),
                            }}
                          />
                          <div className="mt-1 flex justify-between text-[11px] text-(--palette-soft-purple)">
                            <span>{question.leftLabel}</span>
                            <span>{question.rightLabel}</span>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-(--palette-soft-purple)">
                            <span>Importance</span>
                            <span>{importance}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={importance}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              onUpdate(
                                importanceFieldMap[question.importanceKey],
                                nextValue,
                              );
                            }}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
                            style={{ background: sliderFill(importance, 1, 5) }}
                          />
                          <div className="mt-1 flex justify-between text-[11px] text-(--palette-soft-purple)">
                            <span>Low</span>
                            <span>Very important</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-(--palette-deep)">
                <Wallet className="h-4 w-4 text-(--palette-purple)" />
                <h3 className="text-lg font-semibold">7) Home policies</h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    label: "Smoking in the home",
                    key: "smokingPolicy" as const,
                    importanceKey: "smokingImportance" as const,
                    options: [
                      ["not-allowed", "Not allowed"],
                      ["allowed", "Allowed"],
                      ["outside-only", "Outside only"],
                    ] as const,
                  },
                  {
                    label: "Alcohol in the home",
                    key: "alcoholPolicy" as const,
                    importanceKey: "alcoholImportance" as const,
                    options: [
                      ["not-allowed", "Not allowed"],
                      ["occasionally", "Occasionally"],
                      ["allowed", "Allowed"],
                    ] as const,
                  },
                  {
                    label: "Pets in the home",
                    key: "petsPolicy" as const,
                    importanceKey: "petsImportance" as const,
                    options: [
                      ["not-allowed", "Not allowed"],
                      ["allowed", "Allowed"],
                      ["depends", "Depends"],
                    ] as const,
                  },
                ].map((policy) => {
                  const importance = preferenceDraft[policy.importanceKey];
                  const activeValue = preferenceDraft[policy.key];

                  return (
                    <div
                      key={policy.key}
                      className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-(--palette-deep)">
                            {policy.label}
                          </p>
                          <p className="mt-1 text-xs text-(--palette-soft-purple)">
                            Choose one
                          </p>
                        </div>
                        <span className="rounded-full bg-(--palette-chip-bg) px-3 py-1 text-xs font-semibold text-(--palette-purple)">
                          Importance {importance}
                        </span>
                      </div>

                      <div className="grid gap-2">
                        {policy.options.map(([value, label]) => {
                          const active = activeValue === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                onUpdate(policy.key, value);
                              }}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                active
                                  ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                                  : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-(--palette-soft-purple)">
                          <span>Importance</span>
                          <span>{importance}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={importance}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            onUpdate(policy.importanceKey, nextValue);
                          }}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
                          style={{ background: sliderFill(importance, 1, 5) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-(--palette-deep)">
                <UserRound className="h-4 w-4 text-(--palette-purple)" />
                <h3 className="text-lg font-semibold">10-15) Roommate fit</h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    10) What type of roommate do you prefer?
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1.5 sm:grid-cols-4">
                    {(
                      [
                        "Very similar",
                        "Somewhat similar",
                        "Balanced",
                        "Different is fine",
                      ] as FitChoice[]
                    ).map((option) => {
                      const active = preferenceDraft.roommateType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            onUpdate("roommateType", option);
                          }}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                              : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    11) How strict are you about roommate behavior?
                  </label>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-(--palette-soft-purple)">
                    <span>Very flexible</span>
                    <span>{preferenceDraft.behaviorStrictness}/5</span>
                    <span>Very strict</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={preferenceDraft.behaviorStrictness}
                    onChange={(event) => {
                      onUpdate(
                        "behaviorStrictness",
                        Number(event.target.value),
                      );
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
                    style={{
                      background: sliderFill(
                        preferenceDraft.behaviorStrictness,
                        1,
                        5,
                      ),
                    }}
                  />
                </div>

                {[
                  {
                    key: "acceptSmoker" as const,
                    label: "12) Would you accept a smoker roommate?",
                    value: preferenceDraft.acceptSmoker,
                  },
                  {
                    key: "acceptPets" as const,
                    label: "13) Would you accept pets in the home?",
                    value: preferenceDraft.acceptPets,
                  },
                  {
                    key: "acceptGuests" as const,
                    label: "14) Are frequent guests acceptable?",
                    value: preferenceDraft.acceptGuests,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4"
                  >
                    <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                      {item.label}
                    </label>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-1.5">
                      {(["yes", "no"] as YesNo[]).map((option) => {
                        const active = item.value === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              onUpdate(item.key, option);
                            }}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                                : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                            }`}
                          >
                            {option === "yes" ? "Yes" : "No"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="md:col-span-2 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
                    15) Minimum expected stay duration
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        ["1 month", 1],
                        ["3 months", 3],
                        ["6 months", 6],
                        ["12 months", 12],
                      ] as const
                    ).map(([label, months]) => {
                      const active = preferenceDraft.minimumStay === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            onUpdate("minimumStayMonths", months);
                          }}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
                              : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};
