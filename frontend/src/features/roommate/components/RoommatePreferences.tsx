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
  // Existing
  cleanliness: "Cleanliness (1=Very Messy, 5=Very Tidy)",
  sleepSchedule: "Sleep Schedule (1=Early Bird, 5=Night Owl)",
  noiseTolerance: "Noise Tolerance (1=Need Silence, 5=Don't Mind)",
  guests: "Guests (1=No Guests, 5=Guests Often)",
  studyHabits: "Study Habits (1=Need Quiet, 5=Study with Noise)",
  temperature: "Temperature Preference (1=Cold, 5=Warm)",
  personality: "Personality (1=Introvert, 5=Extrovert)",
  smoking: "Smoking",
  pets: "Pets",
  // New hard filter fields
  budgetMin: "Minimum Budget ($)",
  budgetMax: "Maximum Budget ($)",
  preferredLocations: "Preferred Locations",
  moveInDate: "Move-in Date",
  stayDurationMonths: "Stay Duration (Months)",
  drinking: "Drinking",
  // New soft filter fields
  occupation: "Occupation",
  interests: "Interests",
  aboutMe: "About Me",
};

const locationOptions = [
  "Downtown",
  "Campus",
  "Suburbs",
  "Near Transit",
  "Quiet Area",
  "City Center",
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
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  if (!preferences) {
    return (
      <div className="text-center py-8 text-red-500">
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
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
      <div className="space-y-6">
        {/* ===== EXISTING FIELDS ===== */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Lifestyle Preferences</h3>

          {Object.entries(preferences).map(([key, value]) => {
            const field = key as keyof PreferencesType;

            // Skip new fields (handled separately)
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
                <div key={field} className="flex flex-col gap-2 mb-4">
                  <label className="font-medium text-gray-700">
                    {preferenceLabels[field]}
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => onUpdate(field, "no")}
                      className={`px-4 py-2 rounded ${
                        value === "no"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate(field, "yes")}
                      className={`px-4 py-2 rounded ${
                        value === "yes"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={field} className="flex flex-col gap-2 mb-4">
                <label className="font-medium text-gray-700">
                  {preferenceLabels[field]}: {value}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={value as number}
                  onChange={(e) => onUpdate(field, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
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

        {/* ===== BUDGET SECTION ===== */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Budget</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-gray-700 block mb-2">
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
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-2">
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
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ===== LOCATION SECTION ===== */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Location Preferences</h3>
          <div className="flex gap-2 mb-2">
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.preferredLocations.map((location) => (
              <span
                key={location}
                className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {location}
                <button
                  onClick={() => handleRemoveLocation(location)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ===== LIVING PREFERENCES ===== */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Living Preferences</h3>

          <div className="mb-4">
            <label className="font-medium text-gray-700 block mb-2">
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
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="font-medium text-gray-700 block mb-2">
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
            <span className="text-sm text-gray-600">
              {preferences.stayDurationMonths} months
            </span>
          </div>

          <div className="mb-4">
            <label className="font-medium text-gray-700 block mb-2">
              Drinking
            </label>
            <div className="flex gap-4">
              {["no", "sometimes", "yes"].map((option) => (
                <button
                  key={option}
                  onClick={() => onUpdate("drinking", option)}
                  className={`px-4 py-2 rounded ${
                    preferences.drinking === option
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="font-medium text-gray-700 block mb-2">
              Occupation
            </label>
            <select
              value={preferences.occupation}
              onChange={(e) => onUpdate("occupation", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="student">Student</option>
              <option value="working">Working Professional</option>
              <option value="remote">Remote Worker</option>
              <option value="hybrid">Hybrid</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>
        </div>

        {/* ===== INTERESTS SECTION ===== */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Interests & Hobbies</h3>
          <div className="flex gap-2 mb-2">
            <select
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.interests.map((interest) => (
              <span
                key={interest}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ===== ABOUT ME SECTION ===== */}
        <div>
          <h3 className="text-lg font-semibold mb-4">About Me</h3>
          <textarea
            value={preferences.aboutMe}
            onChange={(e) => onUpdate("aboutMe", e.target.value)}
            placeholder="Tell potential roommates about yourself, your habits, and what you're looking for..."
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg resize-none"
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {preferences.aboutMe.length}/500 characters
          </div>
        </div>
      </div>
    </div>
  );
};
