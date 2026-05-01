import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  buildRoommateFormData,
  buildRoommatePreferencesPayload,
  buildRoommateProfilePayload,
  useMyRoommatePreferences,
  useMyRoommateProfile,
  useUpdateRoommatePreferences,
  useUpdateRoommateProfile,
  useMyStoredMatches,
  useGenerateRoommateMatches,
  type RoommateFormData,
} from "../../features/roommate/hooks/useRoommateData";
import { RoommatePreferences } from "../../features/roommate/components/RoommatePreferences";
import { RoommateMatches } from "../../features/roommate/components/RoommateMatches";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import { useInitiateConversation } from "../../features/message/hooks/useMessageHooks";
import type { RoommateMatch } from "../../features/roommate/types/roommateTypes";
import { useTenantRentalContracts } from "../../features/message/hooks/useMessageHooks";
import type { RoommateType } from "../../features/roommate/types/roommateTypes";

// ── One-time type picker ───────────────────────────────────────────────────
interface TypePickerProps {
  onPick: (type: RoommateType) => Promise<void>;
  isSaving: boolean;
}

const TypePicker: React.FC<TypePickerProps> = ({ onPick, isSaving }) => (
  <main className="min-h-screen pt-15">
    <LandingNavbar />
    <div className="flex min-h-[80vh] items-center justify-center bg-(--palette-page-bg) px-4">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-(--palette-deep)">
          Welcome! How can we help you?
        </h1>
        <p className="mb-8 text-center text-sm text-(--palette-soft-purple)">
          Choose your situation to get started. This helps us find the right
          matches for you.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onPick("TYPE_A")}
            className="rounded-2xl border-2 border-(--palette-border) bg-(--palette-card-bg) p-6 text-left shadow-sm transition hover:border-(--palette-purple) hover:shadow-md disabled:opacity-60"
          >
            <div className="mb-3 text-3xl">🏠</div>
            <h2 className="mb-1 text-lg font-bold text-(--palette-deep)">
              I have a rented place
            </h2>
            <p className="text-sm text-(--palette-soft-purple)">
              I'm already renting and looking for someone to share it with.
            </p>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onPick("TYPE_B")}
            className="rounded-2xl border-2 border-(--palette-border) bg-(--palette-card-bg) p-6 text-left shadow-sm transition hover:border-(--palette-purple) hover:shadow-md disabled:opacity-60"
          >
            <div className="mb-3 text-3xl">🔍</div>
            <h2 className="mb-1 text-lg font-bold text-(--palette-deep)">
              I'm looking for a place
            </h2>
            <p className="text-sm text-(--palette-soft-purple)">
              I don't have a place yet and want to find a roommate to rent with.
            </p>
          </button>
        </div>

        {isSaving && (
          <p className="mt-6 animate-pulse text-center text-sm text-(--palette-soft-purple)">
            Saving your choice...
          </p>
        )}
      </div>
    </div>
  </main>
);
// ──────────────────────────────────────────────────────────────────────────

const RoommatePage: React.FC = () => {
  const navigate = useNavigate();

  // ── data hooks ────────────────────────────────────────────────────────────
  const matchesQuery = useMyStoredMatches();
  const generateMatchesMutation = useGenerateRoommateMatches();
  const profileQuery = useMyRoommateProfile();
  const preferencesQuery = useMyRoommatePreferences();
  const updateProfileMutation = useUpdateRoommateProfile();
  const updatePreferencesMutation = useUpdateRoommatePreferences();
  const { user, isPending } = useCurrentUser();
  const rentalsQuery = useTenantRentalContracts();
  const initiateConversation = useInitiateConversation();

  // ── local state ───────────────────────────────────────────────────────────
  const [localPreferences, setLocalPreferences] =
    useState<RoommateFormData | null>(null);
  const [roommateType, setRoommateType] = useState<RoommateType>("TYPE_B");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [activePanel, setActivePanel] = useState<"find-match" | "matches">(
    "find-match",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [startingConversationForUserId, setStartingConversationForUserId] =
    useState<string | null>(null);

  // ── derived server data ───────────────────────────────────────────────────
  const serverProfile = profileQuery.data ?? null;
  const serverPreferences = preferencesQuery.data;
  const formsLoading = profileQuery.isLoading || preferencesQuery.isLoading;
  const formError =
    profileQuery.error?.message || preferencesQuery.error?.message || null;

  const matches: RoommateMatch[] = (matchesQuery.data ?? []).map((m: any) => ({
    ...(m as any),
    name: m.name ?? m.user?.name ?? "",
    email: m.email ?? m.user?.email ?? "",
    score: m.score ?? m.matchScore ?? 0,
  }));
  const loading = matchesQuery.isLoading;
  const error = matchesQuery.error?.message || null;

  // Has the user ever saved a profileType? If not → show picker.
  const hasChosenType = !formsLoading && !!serverProfile?.profileType;

  // ── sync server → local state ─────────────────────────────────────────────
  useEffect(() => {
    if (!serverProfile || !serverPreferences) return;
    setLocalPreferences(
      buildRoommateFormData({
        profile: serverProfile,
        preferences: serverPreferences,
      }),
    );
  }, [serverProfile, serverPreferences]);

  useEffect(() => {
    if (serverProfile?.profileType) {
      setRoommateType(serverProfile.profileType);
    }
  }, [serverProfile?.profileType]);

  // ── rentals ───────────────────────────────────────────────────────────────
  const rentedContracts = rentalsQuery.data ?? [];
  const activeRentedContracts = rentedContracts.filter(
    (c) => c.status === "ACTIVE",
  );
  const hasRentedRoom = activeRentedContracts.length > 0;

  const selectedRentedPropertyId = (() => {
    const listing = activeRentedContracts[0]?.listingId;
    if (!listing || typeof listing === "string") return listing ?? null;
    return listing._id;
  })();

  useEffect(() => {
    if (roommateType === "TYPE_A") {
      const preferred =
        localPreferences?.selectedPropertyId ||
        serverProfile?.selectedPropertyId ||
        selectedRentedPropertyId ||
        null;
      if (!selectedPropertyId && preferred) setSelectedPropertyId(preferred);
    }
  }, [
    localPreferences?.selectedPropertyId,
    roommateType,
    selectedPropertyId,
    selectedRentedPropertyId,
    serverProfile?.selectedPropertyId,
  ]);

  // ── callbacks ─────────────────────────────────────────────────────────────
  const handlePreferenceUpdate = useCallback(
    (
      field: keyof RoommateFormData,
      value: string | number | string[] | null,
    ) => {
      setLocalPreferences((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const buildProfilePayload = useCallback(() => {
    if (!localPreferences) return null;
    return buildRoommateProfilePayload({
      formData: localPreferences,
      profileType: roommateType,
      selectedPropertyId,
    });
  }, [localPreferences, roommateType, selectedPropertyId]);

  const buildPreferencePayload = useCallback(() => {
    if (!localPreferences) return null;
    return buildRoommatePreferencesPayload(localPreferences);
  }, [localPreferences]);

  const saveProfile = useCallback(async () => {
    const payload = buildProfilePayload();
    if (!payload) return false;

    const budgetMin = payload.budgetMin ?? 0;
    const budgetMax = payload.budgetMax ?? null;
    if (
      budgetMax !== null &&
      Number.isFinite(budgetMin) &&
      Number.isFinite(budgetMax) &&
      budgetMax < budgetMin
    ) {
      toast.error("Maximum budget cannot be less than minimum budget");
      return false;
    }

    setIsSaving(true);
    try {
      const profile = await updateProfileMutation.mutateAsync(payload);
      setLocalPreferences((prev) =>
        prev ? buildRoommateFormData({ profile, preferences: prev }) : prev,
      );
      toast.success("Roommate profile saved");
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update roommate data",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [buildProfilePayload, updateProfileMutation]);

  const savePreferences = useCallback(async () => {
    const payload = buildPreferencePayload();
    if (!payload) return false;

    setIsSaving(true);
    try {
      const preferences = await updatePreferencesMutation.mutateAsync(payload);
      setLocalPreferences((prev) =>
        prev ? buildRoommateFormData({ profile: prev, preferences }) : prev,
      );
      toast.success("Roommate preferences saved");
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update roommate data",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [buildPreferencePayload, updatePreferencesMutation]);

  const handleSaveOnly = useCallback(async () => {
    if (activeStep === 1) await saveProfile();
    else await savePreferences();
  }, [activeStep, saveProfile, savePreferences]);

  const handleSaveAndRecompute = useCallback(async () => {
    const profileSaved = await saveProfile();
    const preferencesSaved = await savePreferences();
    if (!profileSaved || !preferencesSaved) return;
    try {
      await generateMatchesMutation.mutateAsync();
      toast.success("Roommate data saved and matches refreshed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to recompute matches",
      );
    }
  }, [generateMatchesMutation, saveProfile, savePreferences]);

  // ── one-time type picker handler ──────────────────────────────────────────
  const handlePickType = useCallback(
    async (type: RoommateType) => {
      setIsSaving(true);
      try {
        await updateProfileMutation.mutateAsync({
          profileType: type,
          selectedPropertyId:
            type === "TYPE_A" ? selectedRentedPropertyId : null,
          updatedFrom: "profile",
        });
        setRoommateType(type);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save your choice",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [updateProfileMutation, selectedRentedPropertyId],
  );

  // ── conversation handler ───────────────────────────────────────────────────
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
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to open conversation",
        );
      } finally {
        setStartingConversationForUserId(null);
      }
    },
    [initiateConversation, isPending, navigate, user?.id],
  );

  // ── guards ────────────────────────────────────────────────────────────────
  if (error || formError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4">
        <div className="text-center">
          <p className="text-lg text-red-500">Error: {error || formError}</p>
          <button
            onClick={() => {
              void matchesQuery.refetch();
              void profileQuery.refetch();
              void preferencesQuery.refetch();
            }}
            className="mt-4 rounded-lg bg-(--palette-purple) px-4 py-2 text-white transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (formsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4 text-(--palette-soft-purple)">
        Loading...
      </div>
    );
  }

  if (!hasChosenType) {
    return <TypePicker onPick={handlePickType} isSaving={isSaving} />;
  }

  if (!localPreferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4 text-(--palette-soft-purple)">
        Loading preferences...
      </div>
    );
  }

  // ── main UI ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pt-15">
      <LandingNavbar />
      <div className="bg-(--palette-page-bg) py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-8 text-center text-3xl font-bold text-(--palette-deep)">
            Find a Roommate
          </h1>

          {/* Type badge */}
          <div className="mb-6 flex justify-center">
            <span className="rounded-full border border-(--palette-border) bg-(--palette-card-bg) px-5 py-2 text-sm font-semibold text-(--palette-purple) shadow-sm">
              {roommateType === "TYPE_A"
                ? "🏠 I have a rented place"
                : "🔍 I'm looking for a place"}
            </span>
          </div>

          {/* Tab navigation — only 2 tabs now */}
          <div className="mb-6 flex flex-wrap items-end gap-10 border-b border-(--palette-border) px-2 pb-1">
            <button
              type="button"
              onClick={() => setActivePanel("find-match")}
              className={`pb-3 text-base font-medium transition ${
                activePanel === "find-match"
                  ? "border-b-2 border-(--palette-purple) text-(--palette-deep)"
                  : "border-b-2 border-transparent text-(--palette-soft-purple) hover:text-(--palette-deep)"
              }`}
            >
              Find Match
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("matches")}
              className={`pb-3 text-base font-medium transition ${
                activePanel === "matches"
                  ? "border-b-2 border-(--palette-purple) text-(--palette-deep)"
                  : "border-b-2 border-transparent text-(--palette-soft-purple) hover:text-(--palette-deep)"
              }`}
            >
              Matches ({matches.length})
            </button>
          </div>

          {/* ── Find Match panel ── */}
          {activePanel === "find-match" ? (
            <div className="space-y-4">
              {roommateType === "TYPE_A" ? (
                hasRentedRoom ? (
                  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-4">
                    <p className="mb-2 text-sm font-semibold text-(--palette-deep)">
                      Select one rented room
                    </p>
                    <select
                      value={selectedPropertyId || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSelectedPropertyId(v);
                        setLocalPreferences((prev) =>
                          prev ? { ...prev, selectedPropertyId: v } : prev,
                        );
                      }}
                      className="w-full rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text) outline-none"
                    >
                      {activeRentedContracts.map((contract) => {
                        const listing = contract.listingId;
                        const listingId =
                          typeof listing === "string" ? listing : listing._id;
                        const label =
                          typeof listing === "string"
                            ? "Rented room"
                            : `${listing.title}${listing.city ? ` • ${listing.city}` : ""}`;
                        return (
                          <option key={contract._id} value={listingId}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) px-6 py-10 text-center shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-(--palette-soft-purple)">
                      No room rented
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-(--palette-deep)">
                      You need an active rental first.
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm text-(--palette-soft-purple)">
                      Browse properties and sign a lease to use this flow.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/properties")}
                      className="mt-6 rounded-full bg-(--palette-purple) px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    >
                      Find a place
                    </button>
                  </div>
                )
              ) : null}

              {roommateType === "TYPE_B" || hasRentedRoom ? (
                <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-4">
                  <div className="mb-4 flex items-center justify-end gap-2">
                    <div className="text-sm text-(--palette-soft-purple)">
                      Step {activeStep} of 2
                    </div>
                  </div>

                  <RoommatePreferences
                    preferences={localPreferences}
                    onUpdate={handlePreferenceUpdate}
                    loading={false}
                    variant={activeStep === 1 ? "profile" : "preferences"}
                  />

                  {isSaving || generateMatchesMutation.isPending ? (
                    <div className="mt-3 animate-pulse text-center text-sm text-(--palette-soft-purple)">
                      {generateMatchesMutation.isPending
                        ? "Finding your matches..."
                        : "Saving changes..."}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {activeStep === 2 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="rounded-lg border border-(--palette-border) px-4 py-2 font-semibold text-(--palette-deep)"
                      >
                        Back
                      </button>
                    ) : null}

                    {activeStep === 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveOnly}
                          className="rounded-lg bg-(--palette-chip-bg) px-4 py-2 font-semibold text-(--palette-deep)"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="rounded-lg bg-(--palette-purple) px-4 py-2 font-semibold text-white"
                        >
                          Next
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveOnly}
                          className="rounded-lg bg-(--palette-chip-bg) px-4 py-2 font-semibold text-(--palette-deep)"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAndRecompute}
                          disabled={
                            isSaving || generateMatchesMutation.isPending
                          }
                          className="rounded-lg bg-(--palette-purple) px-4 py-2 font-semibold text-white disabled:opacity-60"
                        >
                          Save & Recompute
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ── Matches panel ── */}
          {activePanel === "matches" ? (
            <div className="space-y-4">
              <RoommateMatches
                matches={matches}
                loading={loading}
                onStartConversation={handleStartConversation}
                startingConversationForUserId={startingConversationForUserId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
};

export default RoommatePage;
