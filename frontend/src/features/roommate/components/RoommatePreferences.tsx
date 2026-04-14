import React from "react";
import type { RoommatePreferences as PreferencesType } from "../types/roommate.types";

interface Props {
  preferences: PreferencesType | null;
  onUpdate: (field: keyof PreferencesType, value: string | number) => void;
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
};

export const RoommatePreferences: React.FC<Props> = ({
  preferences,
  onUpdate,
  loading,
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Your Roommate Preferences</h2>
      <div className="space-y-6">
        {Object.entries(preferences).map(([key, value]) => {
          const field = key as keyof PreferencesType;

          if (field === "smoking" || field === "pets") {
            return (
              <div key={field} className="flex flex-col gap-2">
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
            <div key={field} className="flex flex-col gap-2">
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
    </div>
  );
};
