import React, { useState } from "react";
import type { RoommatePreferences as PreferencesType } from "../types/roommate.types";

interface Props {
  preferences: PreferencesType | null;
  onUpdate: (
    field: keyof PreferencesType,
    value: string | number | string[] | null,
  ) => void;
  loading?: boolean;
}

const preferenceLabels: Record<keyof PreferencesType, string> = {
  cleanliness: "Cleanliness (1=Very Messy, 5=Very Tidy)",
  sleepSchedule: "Sleep Schedule (1=Early Bird, 5=Night Owl)",
  noiseTolerance: "Noise Tolerance (1=Need Silence, 5=Don't Mind)",
  guests: "Guests (1=No Guests, 5=Guests Often)",
  studyHabits: "Study Habits (1=Need Quiet, 5=Study with Noise)",
  temperature: "Temperature Preference (1=Cold, 5=Warm)",
  personality: "Personality (1=Introvert, 5=Extrovert)",
  smoking: "Smoking",
  pets: "Pets",
  budgetMin: "Minimum Budget ($)",
  budgetMax: "Maximum Budget ($)",
  preferredLocations: "Preferred Locations",
  moveInDate: "Move-in Date",
  stayDurationMonths: "Stay Duration (Months)",
  drinking: "Drinking",
  occupation: "Occupation",
  interests: "Interests",
  aboutMe: "About Me",
};

const locationOptions = [
  "Addis Ketema",
  "Akaky Kaliti",
  "Arada",
  "Bole",
  "Gullele",
  "Kirkos",
  "Kolfe Keranio",
  "Lideta",
  "Nifas",
  " Silk-Lafto",
  " Yeka",
];

const interestOptions = [
  "Gaming",
  "Reading",
  "Sports",
  "Music",
  "Movies",
  "Cooking",
  "Hiking",
  "Travel",
  "Art",
  "Photography",
];

export const RoommatePreferences: React.FC<Props> = ({
  preferences,
  onUpdate,
  loading,
}) => {
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");

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

  const handleAddInterest = () => {
    if (
      newInterest.trim() &&
      !preferences.interests.includes(newInterest.trim())
    ) {
      onUpdate("interests", [...preferences.interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    onUpdate(
      "interests",
      preferences.interests.filter((i) => i !== interest),
    );
  };

  const handleAddLocation = () => {
    if (
      newLocation.trim() &&
      !preferences.preferredLocations.includes(newLocation.trim())
    ) {
      onUpdate("preferredLocations", [
        ...preferences.preferredLocations,
        newLocation.trim(),
      ]);
      setNewLocation("");
    }
  };

  const handleRemoveLocation = (location: string) => {
    onUpdate(
      "preferredLocations",
      preferences.preferredLocations.filter((l) => l !== location),
    );
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-(--palette-deep)">
        Your Profile
      </h2>

      <div className="space-y-6">
        <div className="border-b border-(--palette-border) pb-4">
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            Lifestyle Preferences
          </h3>

          {Object.entries(preferences).map(([key, value]) => {
            const field = key as keyof PreferencesType;

            if (
              [
                "budgetMin",
                "budgetMax",
                "preferredLocations",
                "moveInDate",
                "stayDurationMonths",
                "drinking",
                "occupation",
                "interests",
                "aboutMe",
              ].includes(field)
            ) {
              return null;
            }

            if (field === "smoking" || field === "pets") {
              return (
                <div key={field} className="mb-4 flex flex-col gap-2">
                  <label className="font-medium text-(--palette-deep)">
                    {preferenceLabels[field]}
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => onUpdate(field, "no")}
                      className={`rounded-lg px-4 py-2 transition ${
                        value === "no"
                          ? "bg-(--palette-purple) text-white"
                          : "bg-(--palette-card-muted-bg) text-(--app-text)"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate(field, "yes")}
                      className={`rounded-lg px-4 py-2 transition ${
                        value === "yes"
                          ? "bg-(--palette-purple) text-white"
                          : "bg-(--palette-card-muted-bg) text-(--app-text)"
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={field} className="mb-4 flex flex-col gap-2">
                <label className="font-medium text-(--palette-deep)">
                  {preferenceLabels[field]}: {value}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={value as number}
                  onChange={(e) => onUpdate(field, parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-(--palette-card-muted-bg)"
                />
                <div className="flex justify-between text-xs text-(--palette-soft-purple)">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-b border-(--palette-border) pb-4">
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            Budget
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-medium text-(--palette-deep)">
                Min Budget ($)
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
                className="w-full rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-(--palette-deep)">
                Max Budget ($)
              </label>
              <input
                type="number"
                min="0"
                value={
                  Number.isFinite(preferences.budgetMax)
                    ? preferences.budgetMax
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdate(
                    "budgetMax",
                    value === "" ? Number.NaN : Number(value),
                  );
                }}
                className="w-full rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-(--palette-border) pb-4">
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            Location Preferences
          </h3>
          <div className="mb-2 flex gap-2">
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
            >
              <option value="">Select a location...</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddLocation}
              className="rounded-lg bg-(--palette-purple) px-4 py-2 text-white transition hover:opacity-90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.preferredLocations.map((location) => (
              <span
                key={location}
                className="flex items-center gap-2 rounded-full bg-(--palette-chip-bg) px-3 py-1 text-sm text-(--palette-deep)"
              >
                {location}
                <button
                  onClick={() => handleRemoveLocation(location)}
                  className="text-(--palette-soft-purple) hover:opacity-80"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="border-b border-(--palette-border) pb-4">
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            Living Preferences
          </h3>

          <div className="mb-4">
            <label className="mb-2 block font-medium text-(--palette-deep)">
              Move-in Date
            </label>
            <input
              type="date"
              value={
                preferences.moveInDate
                  ? preferences.moveInDate.split("T")[0]
                  : ""
              }
              onChange={(e) => onUpdate("moveInDate", e.target.value || null)}
              className="w-full rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block font-medium text-(--palette-deep)">
              Stay Duration (months)
            </label>
            <input
              type="range"
              min="1"
              max="60"
              value={preferences.stayDurationMonths}
              onChange={(e) =>
                onUpdate("stayDurationMonths", parseInt(e.target.value))
              }
              className="w-full"
            />
            <span className="text-sm text-(--palette-soft-purple)">
              {preferences.stayDurationMonths} months
            </span>
          </div>

          <div className="mb-4">
            <label className="mb-2 block font-medium text-(--palette-deep)">
              Drinking
            </label>
            <div className="flex gap-4">
              {["no", "sometimes", "yes"].map((option) => (
                <button
                  key={option}
                  onClick={() => onUpdate("drinking", option)}
                  className={`rounded-lg px-4 py-2 transition ${
                    preferences.drinking === option
                      ? "bg-(--palette-purple) text-white"
                      : "bg-(--palette-card-muted-bg) text-(--app-text)"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block font-medium text-(--palette-deep)">
              Occupation
            </label>
            <select
              value={preferences.occupation}
              onChange={(e) => onUpdate("occupation", e.target.value)}
              className="w-full rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
            >
              <option value="student">Student</option>
              <option value="working">Working Professional</option>
              <option value="remote">Remote Worker</option>
              <option value="hybrid">Hybrid</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>
        </div>

        <div className="border-b border-(--palette-border) pb-4">
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            Interests & Hobbies
          </h3>
          <div className="mb-2 flex gap-2">
            <select
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
            >
              <option value="">Select an interest...</option>
              {interestOptions.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddInterest}
              className="rounded-lg bg-(--palette-purple) px-4 py-2 text-white transition hover:opacity-90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.interests.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-2 rounded-full bg-(--palette-card-muted-bg) px-3 py-1 text-sm text-(--palette-deep)"
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="text-(--palette-soft-purple) hover:opacity-80"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-(--palette-deep)">
            About Me
          </h3>
          <textarea
            value={preferences.aboutMe}
            onChange={(e) => onUpdate("aboutMe", e.target.value)}
            placeholder="Tell potential roommates about yourself, your habits, and what you're looking for..."
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
          />
          <div className="mt-1 text-right text-sm text-(--palette-soft-purple)">
            {preferences.aboutMe.length}/500 characters
          </div>
        </div>
      </div>
    </div>
  );
};
