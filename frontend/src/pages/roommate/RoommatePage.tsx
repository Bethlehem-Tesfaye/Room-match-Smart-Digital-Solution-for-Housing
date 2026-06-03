import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, RefreshCw, Search } from "lucide-react";
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
import { RoommateWizard } from "../../features/roommate/components/Roommatewizard";
import { RoommateMatches } from "../../features/roommate/components/RoommateMatches";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import {
  useInitiateConversation,
  useTenantRentalContracts,
} from "../../features/message/hooks/useMessageHooks";
import type {
  RoommateMatch,
  RoommateType,
} from "../../features/roommate/types/roommateTypes";

// ── TypePicker (unchanged) ─────────────────────────────────────────────────
interface TypePickerProps {
  onPick: (type: RoommateType) => Promise<void>;
  isSaving: boolean;
  canChooseTypeA: boolean;
  typeABlockedMessage?: string | null;
}

const TypePicker: React.FC<TypePickerProps> = ({
  onPick,
  isSaving,
  canChooseTypeA,
  typeABlockedMessage,
}) => (
  <main
    className="min-h-screen pb-12"
    style={{ backgroundColor: "var(--palette-page-bg)" }}
  >
    <LandingNavbar />
    <div className="mx-auto max-w-7xl px-4 pt-24">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2 text-center font-serif text-3xl font-bold text-(--palette-deep)">
            Welcome! How can we help you?
          </h1>
          <p className="mb-8 text-center text-[15px] leading-relaxed text-(--palette-soft-purple)">
            Choose your situation to get started. This helps us find the right
            matches for you.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void onPick("TYPE_A")}
              className="rounded-2xl border-2 border-(--palette-border) bg-(--palette-card-bg) p-6 text-left shadow-sm transition hover:border-(--palette-purple) hover:shadow-md disabled:opacity-60"
              aria-disabled={!canChooseTypeA}
              title={
                !canChooseTypeA
                  ? (typeABlockedMessage ??
                    "This rental does not allow roommates")
                  : undefined
              }
              disabled={isSaving || !canChooseTypeA}
            >
              <div className="mb-3 text-3xl">🏠</div>
              <h2 className="mb-1 font-serif text-lg font-bold text-(--palette-deep)">
                I have a rented place
              </h2>
              <p className="text-sm leading-relaxed text-(--app-text)">
                I'm already renting and looking for someone to share it with.
              </p>
              {!canChooseTypeA && typeABlockedMessage ? (
                <p className="mt-3 text-[12px] leading-relaxed text-(--palette-purple)">
                  {typeABlockedMessage}
                </p>
              ) : null}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onPick("TYPE_B")}
              className="rounded-2xl border-2 border-(--palette-border) bg-(--palette-card-bg) p-6 text-left shadow-sm transition hover:border-(--palette-purple) hover:shadow-md disabled:opacity-60"
            >
              <div className="mb-3 text-3xl">🔍</div>
              <h2 className="mb-1 font-serif text-lg font-bold text-(--palette-deep)">
                I'm looking for a place
              </h2>
              <p className="text-sm leading-relaxed text-(--app-text)">
                I don't have a place yet and want to find a roommate to rent
                with.
              </p>
            </button>
          </div>
          {isSaving && (
            <p className="mt-6 animate-pulse text-center text-[12px] leading-relaxed text-(--palette-soft-purple)">
              Saving your choice...
            </p>
          )}
        </div>
      </div>
    </div>
  </main>
);

// ── RoommatePage ───────────────────────────────────────────────────────────
const RoommatePage: React.FC = () => {
  const navigate = useNavigate();

  const matchesQuery = useMyStoredMatches();
  const generateMatchesMutation = useGenerateRoommateMatches();
  const profileQuery = useMyRoommateProfile();
  const preferencesQuery = useMyRoommatePreferences();
  const updateProfileMutation = useUpdateRoommateProfile();
  const updatePreferencesMutation = useUpdateRoommatePreferences();
  const { user, isPending } = useCurrentUser();
  const rentalsQuery = useTenantRentalContracts();
  const initiateConversation = useInitiateConversation();

  const [localPreferences, setLocalPreferences] =
    useState<RoommateFormData | null>(null);
  const [roommateType, setRoommateType] = useState<RoommateType>("TYPE_B");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [activePanel, setActivePanel] = useState<"find-match" | "matches">(
    "find-match",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [startingConversationForUserId, setStartingConversationForUserId] =
    useState<string | null>(null);
  const [pendingTypeChange, setPendingTypeChange] =
    useState<RoommateType | null>(null);

  const serverProfile = profileQuery.data ?? null;
  const serverPreferences = preferencesQuery.data;
  const formsLoading =
    profileQuery.isLoading ||
    preferencesQuery.isLoading ||
    rentalsQuery.isLoading;
  const formError =
    profileQuery.error?.message || preferencesQuery.error?.message || null;
  const rentalError = rentalsQuery.error?.message || null;

  const matches: RoommateMatch[] = (matchesQuery.data ?? []).map((m: any) => ({
    ...(m as any),
    name: m.name ?? m.user?.name ?? "",
    email: m.email ?? m.user?.email ?? "",
    score: m.score ?? m.matchScore ?? 0,
  }));
  const loading = matchesQuery.isLoading;
  const error = matchesQuery.error?.message || null;

  const hasChosenType = !formsLoading && !!serverProfile?.profileType;

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
    if (serverProfile?.profileType) setRoommateType(serverProfile.profileType);
  }, [serverProfile?.profileType]);

  const rentedContracts = rentalsQuery.data ?? [];
  const activeRentedContracts = rentedContracts.filter(
    (c) => c.status === "ACTIVE",
  );
  const hasRentedRoom = activeRentedContracts.length > 0;

  const getContractListing = (
    contract?: (typeof activeRentedContracts)[number],
  ) => {
    if (!contract) return null;

    const listing = contract.listingId;
    return typeof listing === "string" ? null : listing;
  };

  const listingAllowsRoommates = (
    listing: ReturnType<typeof getContractListing>,
  ) => Boolean(listing?.allowRoommates);

  const getListingId = (
    listing: ReturnType<typeof getContractListing>,
  ): string | null => {
    if (!listing?._id) return null;
    return String(listing._id);
  };

  const roommateEligibleContracts = activeRentedContracts.filter((contract) =>
    listingAllowsRoommates(getContractListing(contract)),
  );
  const hasEligibleRoommateRental = roommateEligibleContracts.length > 0;
  const canUseRoommateWizard =
    roommateType === "TYPE_B" || hasEligibleRoommateRental;

  const selectedRentedPropertyId = getListingId(
    getContractListing(roommateEligibleContracts[0]),
  );

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

  const handlePreferenceUpdate = useCallback(
    (
      field: keyof RoommateFormData,
      value: string | number | string[] | null,
    ) => {
      setLocalPreferences((prev) =>
        prev ? { ...prev, [field]: value } : prev,
      );
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

  const buildTypeSwitchPayload = useCallback(
    (nextType: RoommateType) => {
      if (!localPreferences) return null;

      return buildRoommateProfilePayload({
        formData: localPreferences,
        profileType: nextType,
        selectedPropertyId:
          nextType === "TYPE_A" ? selectedRentedPropertyId : null,
      });
    },
    [localPreferences, selectedRentedPropertyId],
  );

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
      toast.success("Profile saved");
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
      toast.success("Preferences saved");
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

  const handleSave = useCallback(async () => {
    await Promise.all([saveProfile(), savePreferences()]);
  }, [saveProfile, savePreferences]);

  const handleSaveAndRecompute = useCallback(async () => {
    const [profileSaved, preferencesSaved] = await Promise.all([
      saveProfile(),
      savePreferences(),
    ]);
    if (!profileSaved || !preferencesSaved) return;
    try {
      await generateMatchesMutation.mutateAsync();
      toast.success("Matches refreshed!");
      setActivePanel("matches");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to recompute matches",
      );
    }
  }, [generateMatchesMutation, saveProfile, savePreferences]);

  const handlePickType = useCallback(
    async (type: RoommateType) => {
      if (type === "TYPE_A" && !hasEligibleRoommateRental) {
        toast.error("This rental does not allow roommates");
        return;
      }

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
    [
      hasEligibleRoommateRental,
      updateProfileMutation,
      selectedRentedPropertyId,
    ],
  );

  const handleChangeType = useCallback(() => {
    const nextType: RoommateType =
      roommateType === "TYPE_A" ? "TYPE_B" : "TYPE_A";

    if (nextType === "TYPE_A" && !hasEligibleRoommateRental) {
      toast.error("This rental does not allow roommates");
      return;
    }

    setPendingTypeChange(nextType);
  }, [hasEligibleRoommateRental, roommateType]);

  const confirmTypeChange = useCallback(async () => {
    if (!pendingTypeChange) return;

    const payload = buildTypeSwitchPayload(pendingTypeChange);
    if (!payload) return;

    setIsSaving(true);
    try {
      const profile = await updateProfileMutation.mutateAsync(payload);

      setRoommateType(profile.profileType);
      setSelectedPropertyId(profile.selectedPropertyId ?? null);
      setLocalPreferences((prev) =>
        prev ? buildRoommateFormData({ profile, preferences: prev }) : prev,
      );

      setPendingTypeChange(null);
      toast.success("Roommate type updated and matches refreshed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change roommate type",
      );
    } finally {
      setIsSaving(false);
    }
  }, [buildTypeSwitchPayload, pendingTypeChange, updateProfileMutation]);

  const handleStartConversation = useCallback(
    async (match: RoommateMatch) => {
      if (isPending || !match.userId) {
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
  if (error || formError || rentalError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4">
        <div className="text-center">
          <p className="text-[15px] leading-relaxed text-(--app-text)">
            Error: {error || formError || rentalError}
          </p>
          <button
            onClick={() => {
              void matchesQuery.refetch();
              void profileQuery.refetch();
              void preferencesQuery.refetch();
              void rentalsQuery.refetch();
            }}
            className="mt-4 rounded-lg bg-(--palette-purple) px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (formsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4 text-[15px] leading-relaxed text-(--palette-soft-purple)">
        Loading...
      </div>
    );
  }

  if (!hasChosenType)
    return (
      <TypePicker
        onPick={handlePickType}
        isSaving={isSaving}
        canChooseTypeA={hasEligibleRoommateRental}
        typeABlockedMessage={
          hasRentedRoom && !hasEligibleRoommateRental
            ? "This rental does not allow roommates"
            : null
        }
      />
    );

  if (!localPreferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--palette-page-bg) px-4 text-[15px] leading-relaxed text-(--palette-soft-purple)">
        Loading preferences...
      </div>
    );
  }

  // ── main UI ───────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen pb-12"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <LandingNavbar />
      <div className="mx-auto max-w-7xl px-4 pt-24">
        <div>
          <h1 className="mb-6 text-center font-serif text-3xl font-bold text-(--palette-deep)">
            Find a roommate
          </h1>

          {/* Type badge */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--palette-border) bg-(--palette-card-bg) px-5 py-2 text-sm text-(--palette-purple) shadow-sm">
              {roommateType === "TYPE_A" ? (
                <span className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" /> I have a rented place
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="h-4 w-4" /> I'm looking for a place
                </span>
              )}
              <button
                type="button"
                onClick={() => void handleChangeType()}
                disabled={
                  isSaving ||
                  (roommateType === "TYPE_B" && !hasEligibleRoommateRental)
                }
                title={
                  roommateType === "TYPE_B" && !hasEligibleRoommateRental
                    ? hasRentedRoom
                      ? "This rental does not allow roommates"
                      : "You need an active roommate-friendly rental"
                    : "Change roommate type"
                }
                aria-label="Change roommate type"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-(--palette-soft-purple) transition hover:border-(--palette-purple) hover:bg-(--palette-page-bg) hover:text-(--palette-purple) disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-8 border-b border-(--palette-border) px-1">
            <button
              type="button"
              onClick={() => setActivePanel("find-match")}
              className={`pb-3 text-sm transition ${
                activePanel === "find-match"
                  ? "border-b-2 border-(--palette-purple) font-bold text-(--palette-deep)"
                  : "border-b-2 border-transparent text-(--palette-soft-purple) hover:text-(--palette-deep)"
              }`}
            >
              Find match
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("matches")}
              className={`pb-3 text-sm transition ${
                activePanel === "matches"
                  ? "border-b-2 border-(--palette-purple) font-bold text-(--palette-deep)"
                  : "border-b-2 border-transparent text-(--palette-soft-purple) hover:text-(--palette-deep)"
              }`}
            >
              Matches ({matches.length})
            </button>
          </div>

          {/* ── Find Match panel ── */}
          {activePanel === "find-match" && (
            <div className="space-y-4">
              {/* Property selector for TYPE_A */}
              {roommateType === "TYPE_A" &&
                (hasEligibleRoommateRental ? (
                  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-card-bg) p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                      Select rented room
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
                      {roommateEligibleContracts.map((contract) => {
                        const listing = getContractListing(contract);
                        const listingId = getListingId(listing) ?? "";
                        const label = listing
                          ? `${listing.title}${listing.city ? ` • ${listing.city}` : ""}`
                          : "Rented room";
                        return (
                          <option key={contract._id} value={listingId}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : hasRentedRoom ? (
                  <div className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) px-6 py-10 text-center shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                      Roommate matching is not allowed for your rental
                    </p>
                    <h2 className="mt-3 font-serif text-2xl font-bold text-(--palette-deep)">
                      The property owner has disabled roommate sharing for your
                      current rental.
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-(--palette-soft-purple)">
                      Browse roommate-friendly properties if you want to switch
                      to a shared-home setup.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/properties")}
                      className="mt-6 rounded-full bg-(--palette-purple) px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                    >
                      Browse roommate-friendly properties
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) px-6 py-10 text-center shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-(--palette-soft-purple)">
                      No room rented
                    </p>
                    <h2 className="mt-3 font-serif text-2xl font-bold text-(--palette-deep)">
                      You need an active rental first.
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-(--palette-soft-purple)">
                      Browse properties and sign a lease to use this flow.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/properties")}
                      className="mt-6 rounded-full bg-(--palette-purple) px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                    >
                      Find a place
                    </button>
                  </div>
                ))}

              {canUseRoommateWizard && (
                <RoommateWizard
                  preferences={localPreferences}
                  onUpdate={handlePreferenceUpdate}
                  isSaving={isSaving}
                  isComputing={generateMatchesMutation.isPending}
                  onSave={handleSave}
                  onSaveAndRecompute={handleSaveAndRecompute}
                />
              )}
            </div>
          )}

          {/* ── Matches panel ── */}
          {activePanel === "matches" && (
            <div className="space-y-4">
              <RoommateMatches
                matches={matches}
                loading={loading}
                onStartConversation={handleStartConversation}
                startingConversationForUserId={startingConversationForUserId}
              />
            </div>
          )}

          {pendingTypeChange && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
              <div className="w-full max-w-lg rounded-3xl border border-(--palette-border) bg-(--palette-card-bg) p-6 shadow-2xl">
                <h2 className="font-serif text-2xl font-bold text-(--palette-deep)">
                  Change roommate type?
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-(--palette-soft-purple)">
                  Changing your roommate type will:
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-(--app-text)">
                  <li>• remove your current roommate matches</li>
                  <li>• recompute new compatible matches</li>
                  <li>• reset your rented property selection if needed</li>
                </ul>
                <p className="mt-4 rounded-2xl bg-(--palette-page-bg) px-4 py-3 text-sm leading-relaxed text-(--app-text)">
                  {pendingTypeChange === "TYPE_A"
                    ? "You will switch to: I have a rented place"
                    : "You will switch to: I'm looking for a place"}
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingTypeChange(null)}
                    disabled={isSaving}
                    className="rounded-full border border-(--palette-border) px-4 py-2 text-sm font-bold text-(--palette-deep) transition hover:bg-(--palette-page-bg) disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmTypeChange()}
                    disabled={isSaving}
                    className="rounded-full bg-(--palette-purple) px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {isSaving ? "Changing..." : "Yes, change type"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default RoommatePage;
