import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRoommate } from "../../features/roommate/hooks/useRoommate";
import { RoommatePreferences } from "../../features/roommate/components/RoommatePreferences";
import { RoommateMatches } from "../../features/roommate/components/RoommateMatches";
import type { RoommatePreferences as PreferencesType } from "../../features/roommate/types/roommate.types";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import { useInitiateConversation } from "../../features/message/hooks/useMessageHooks";
import type { RoommateMatch } from "../../features/roommate/types/roommate.types";

const RoommatePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    preferences: serverPreferences,
    matches,
    loading,
    error,
    updatePreferences,
    refresh,
  } = useRoommate();
  const { user, isPending } = useCurrentUser();
  const initiateConversation = useInitiateConversation();

  const [localPreferences, setLocalPreferences] =
    useState<PreferencesType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startingConversationForUserId, setStartingConversationForUserId] =
    useState<string | null>(null);

  // Load server preferences into local state (only once when data arrives)
  useEffect(() => {
    if (serverPreferences && !localPreferences) {
      setLocalPreferences(serverPreferences);
    }
  }, [serverPreferences, localPreferences]);

  // Update local state only; API request runs when Find New Matches is clicked.
  const handlePreferenceUpdate = useCallback(
    (
      field: keyof PreferencesType,
      value: string | number | string[] | null,
    ) => {
      setLocalPreferences((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  // Send preferences and refresh matches only when user clicks the button.
  const handleRefresh = useCallback(async () => {
    if (localPreferences) {
      const budgetMin = Number(localPreferences.budgetMin);
      const budgetMax = Number(localPreferences.budgetMax);

      if (!Number.isFinite(budgetMin)) {
        toast.error("Minimum budget field can't be empty");
        return;
      }

      if (!Number.isFinite(budgetMax)) {
        toast.error("Maximum budget field can't be empty");
        return;
      }

      if (budgetMin < 0 || budgetMax < 0) {
        toast.error("Budget values must be zero or greater");
        return;
      }

      if (budgetMin > budgetMax) {
        toast.error("Minimum budget cannot be greater than maximum budget");
        return;
      }
    }

    if (localPreferences) {
      setIsSaving(true);
      try {
        await updatePreferences(localPreferences);
        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update roommate preferences";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    await refresh();
  }, [localPreferences, updatePreferences, refresh]);

  const handleStartConversation = useCallback(
    async (match: RoommateMatch) => {
      if (isPending) return;

      if (!match.userId) {
        toast.error("Roommate user not found");
        return;
      }

      if (user?.id === match.userId) {
        toast.error("You cannot message yourself");
        return;
      }

      setStartingConversationForUserId(match.userId);

      try {
        const conversation = await initiateConversation.mutateAsync({
          userId: match.userId,
          isRoommateChat: true,
        });

        navigate(`/message?conversationId=${conversation._id}`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to open conversation";
        toast.error(message);
      } finally {
        setStartingConversationForUserId(null);
      }
    },
    [initiateConversation, isPending, navigate, user?.id],
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4">
        <div className="text-center">
          <p className="text-lg text-red-500">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-(--palette-purple) px-4 py-2 text-white transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4 text-(--palette-soft-purple)">
        Loading preferences...
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-15">
      <LandingNavbar />
      <div className="bg-(--palette-page-bg) py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-8 text-center text-3xl font-bold text-(--palette-deep)">
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
                <div className="animate-pulse text-center text-sm text-(--palette-soft-purple)">
                  Saving changes...
                </div>
              )}
            </div>

            {/* Right Column: Matches */}
            <div className="space-y-4">
              <RoommateMatches
                matches={matches}
                loading={loading}
                onStartConversation={handleStartConversation}
                startingConversationForUserId={startingConversationForUserId}
              />
              <button
                onClick={handleRefresh}
                disabled={loading || isSaving}
                className="w-full rounded-lg bg-(--palette-purple) px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading || isSaving
                  ? "Finding Matches..."
                  : "🔍 Find New Matches"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RoommatePage;
