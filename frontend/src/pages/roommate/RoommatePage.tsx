import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRoommate } from "../../features/roommate/hooks/useRoommate";
import { RoommatePreferences } from "../../features/roommate/components/RoommatePreferences";
import { RoommateMatches } from "../../features/roommate/components/RoommateMatches";
import type { RoommatePreferences as PreferencesType } from "../../features/roommate/types/roommate.types";
import LandingNavbar from "../../features/landing/components/LandingNavbar";

const RoommatePage: React.FC = () => {
  const {
    preferences: serverPreferences,
    matches,
    loading,
    error,
    updatePreferences,
    refresh,
  } = useRoommate();

  const [localPreferences, setLocalPreferences] =
    useState<PreferencesType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load server preferences into local state (only once when data arrives)
  useEffect(() => {
    if (serverPreferences && !localPreferences) {
      setLocalPreferences(serverPreferences);
    }
  }, [serverPreferences, localPreferences]);

  // Debounced save - waits 1 second after user stops typing/moving
  const debouncedSave = useCallback(
    (updatedPrefs: PreferencesType) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updatePreferences(updatedPrefs);
          console.log("Saved successfully");
        } catch (err) {
          console.error("Save failed:", err);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    },
    [updatePreferences],
  );

  // Handle preference update - NO flicker, NO immediate save
  const handlePreferenceUpdate = useCallback(
    (
      field: keyof PreferencesType,
      value: string | number | string[] | null,
    ) => {
      setLocalPreferences((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, [field]: value };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  // Manual refresh - only when user clicks button
  const handleRefresh = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (localPreferences) {
      setIsSaving(true);
      await updatePreferences(localPreferences);
      setIsSaving(false);
    }
    refresh();
  }, [localPreferences, updatePreferences, refresh]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading preferences...
      </div>
    );
  }

  return (
    <main className="pt-15">
      <LandingNavbar />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold text-center mb-8">
            Find Your Perfect Roommate
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Preferences */}
            <div className="space-y-4">
              <RoommatePreferences
                preferences={localPreferences}
                onUpdate={handlePreferenceUpdate}
                loading={false}
              />
              {isSaving && (
                <div className="text-sm text-gray-500 text-center animate-pulse">
                  Saving changes...
                </div>
              )}
            </div>

            {/* Right Column: Matches */}
            <div className="space-y-4">
              <RoommateMatches matches={matches} loading={loading} />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-semibold"
              >
                {loading ? "Finding Matches..." : "🔍 Find New Matches"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RoommatePage;
