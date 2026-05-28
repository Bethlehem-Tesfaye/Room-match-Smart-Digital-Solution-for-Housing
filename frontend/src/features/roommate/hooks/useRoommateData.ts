import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

import { api } from "../../../lib/axios";
import type {
  RoommateMatchAPI,
  RoommateMatchView,
} from "../types/roommateTypes";

export type RoommateProfile = {
  userId: string;
  profileType: "TYPE_A" | "TYPE_B";
  selectedPropertyId?: string | null;
  updatedFrom?: "profile" | "preferences" | "matching";

  currentStatus: "Student" | "Employed" | "Self-employed" | "Other";
  occupation: string;
  lifestyleType: string;

  socialLevel: number;
  cleanliness: number;
  sleepSchedule: number;
  noiseTolerance: number;
  guests: number;
  interactionLevel: number;
  responsibility: number;

  smoking: "yes" | "no";
  drinking: "yes" | "no" | "sometimes";
  pets: "yes" | "no";

  budgetMin: number;
  budgetMax: number | null;
};

export type RoommatePreferences = {
  userId: string;

  preferredCleanliness: number;
  preferredSleepSchedule: number;
  preferredNoiseTolerance: number;
  preferredGuests: number;
  preferredSocialAtmosphere: number;
  preferredInteractionLevel: number;
  preferredResponsibility: number;

  cleanlinessWeight: number;
  sleepWeight: number;
  noiseWeight: number;
  guestsWeight: number;
  socialWeight: number;
  interactionWeight: number;
  responsibilityWeight: number;

  smokingPolicy: "not-allowed" | "allowed" | "outside-only";
  smokingImportance: number;

  alcoholPolicy: "not-allowed" | "occasionally" | "allowed";
  alcoholImportance: number;

  petsPolicy: "not-allowed" | "allowed" | "depends";
  petsImportance: number;

  roommateType: string;
  behaviorStrictness: number;

  acceptSmoker: "yes" | "no";
  acceptPets: "yes" | "no";
  acceptGuests: "yes" | "no";

  minimumStayMonths: number;
};

export type RoommateFormData = RoommateProfile &
  RoommatePreferences & {
    personality: number;
    studyHabits: number;
    temperature: number;
    stayDurationMonths: number;
    preferredLocations: string[];
    moveInDate: string | null;
    interests: string[];
    aboutMe: string;
  };

const roommateQueryKeys = {
  profile: ["roommate", "profile"] as const,
  preferences: ["roommate", "preferences"] as const,
  matches: ["roommate", "matches"] as const,
  requests: ["roommate", "requests"] as const,
};

const isLifestyleType = (
  value: string,
): value is "Structured" | "Balanced" | "Relaxed" | "Flexible" =>
  ["Structured", "Balanced", "Relaxed", "Flexible"].includes(value);

const getStatusCode = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }

  const maybeResponse = error as {
    response?: { status?: number };
  };

  return maybeResponse.response?.status ?? null;
};

export const createDefaultRoommateProfile = (): RoommateProfile => ({
  userId: "",
  profileType: "TYPE_B",
  selectedPropertyId: null,
  currentStatus: "Student",
  occupation: "",
  lifestyleType: "",
  socialLevel: 3,
  cleanliness: 3,
  sleepSchedule: 3,
  noiseTolerance: 3,
  guests: 3,
  interactionLevel: 3,
  responsibility: 3,
  smoking: "no",
  drinking: "no",
  pets: "no",
  budgetMin: 0,
  budgetMax: null,
});

export const createDefaultRoommatePreferences = (): RoommatePreferences => ({
  userId: "",
  preferredCleanliness: 3,
  preferredSleepSchedule: 3,
  preferredNoiseTolerance: 3,
  preferredGuests: 3,
  preferredSocialAtmosphere: 3,
  preferredInteractionLevel: 3,
  preferredResponsibility: 3,
  cleanlinessWeight: 3,
  sleepWeight: 3,
  noiseWeight: 3,
  guestsWeight: 3,
  socialWeight: 3,
  interactionWeight: 3,
  responsibilityWeight: 3,
  smokingPolicy: "not-allowed",
  smokingImportance: 3,
  alcoholPolicy: "occasionally",
  alcoholImportance: 3,
  petsPolicy: "not-allowed",
  petsImportance: 3,
  roommateType: "Balanced",
  behaviorStrictness: 3,
  acceptSmoker: "no",
  acceptPets: "no",
  acceptGuests: "no",
  minimumStayMonths: 1,
});

export const createDefaultRoommateFormData = (): RoommateFormData => {
  const profile = createDefaultRoommateProfile();
  const preferences = createDefaultRoommatePreferences();

  return {
    ...preferences,
    ...profile,
    personality: profile.socialLevel,
    studyHabits: profile.interactionLevel,
    temperature: profile.responsibility,
    stayDurationMonths: preferences.minimumStayMonths,
    preferredLocations: [],
    moveInDate: null,
    interests: [],
    aboutMe: "",
  };
};

export const buildRoommateFormData = ({
  profile,
  preferences,
}: {
  profile?: Partial<RoommateProfile> | null;
  preferences?: Partial<RoommatePreferences> | null;
}): RoommateFormData => {
  const defaultForm = createDefaultRoommateFormData();
  const nextProfile = {
    ...createDefaultRoommateProfile(),
    ...profile,
  };
  const nextPreferences = {
    ...createDefaultRoommatePreferences(),
    ...preferences,
  };
  const lifestyleType = isLifestyleType(nextProfile.lifestyleType)
    ? nextProfile.lifestyleType
    : nextProfile.lifestyleType || defaultForm.lifestyleType;

  return {
    ...defaultForm,
    ...nextPreferences,
    ...nextProfile,
    lifestyleType,
    personality: nextProfile.socialLevel ?? defaultForm.personality,
    studyHabits: nextProfile.interactionLevel ?? defaultForm.studyHabits,
    temperature: nextProfile.responsibility ?? defaultForm.temperature,
    stayDurationMonths:
      nextPreferences.minimumStayMonths ?? defaultForm.stayDurationMonths,
  };
};

export const buildRoommateProfilePayload = ({
  formData,
  profileType,
  selectedPropertyId,
}: {
  formData: RoommateFormData;
  profileType: RoommateProfile["profileType"];
  selectedPropertyId: string | null;
}): Partial<RoommateProfile> => {
  const budgetMin = Number.isFinite(formData.budgetMin)
    ? formData.budgetMin
    : 0;
  const budgetMax =
    typeof formData.budgetMax === "number" &&
    Number.isFinite(formData.budgetMax)
      ? formData.budgetMax
      : null;

  return {
    profileType,
    selectedPropertyId: profileType === "TYPE_A" ? selectedPropertyId : null,
    currentStatus: formData.currentStatus,
    occupation: formData.occupation,
    lifestyleType: formData.lifestyleType,
    socialLevel: formData.socialLevel,
    cleanliness: formData.cleanliness,
    sleepSchedule: formData.sleepSchedule,
    noiseTolerance: formData.noiseTolerance,
    guests: formData.guests,
    interactionLevel: formData.interactionLevel ?? formData.studyHabits ?? 3,
    responsibility: formData.responsibility ?? formData.temperature ?? 3,
    smoking: formData.smoking,
    drinking: formData.drinking,
    pets: formData.pets,
    budgetMin,
    budgetMax,
    updatedFrom: "profile",
  };
};

export const buildRoommatePreferencesPayload = (
  formData: RoommateFormData,
): Partial<RoommatePreferences> => ({
  preferredCleanliness: formData.preferredCleanliness,
  preferredSleepSchedule: formData.preferredSleepSchedule,
  preferredNoiseTolerance: formData.preferredNoiseTolerance,
  preferredGuests: formData.preferredGuests,
  preferredSocialAtmosphere: formData.preferredSocialAtmosphere,
  preferredInteractionLevel: formData.preferredInteractionLevel,
  preferredResponsibility: formData.preferredResponsibility,
  cleanlinessWeight: formData.cleanlinessWeight,
  sleepWeight: formData.sleepWeight,
  noiseWeight: formData.noiseWeight,
  guestsWeight: formData.guestsWeight,
  socialWeight: formData.socialWeight,
  interactionWeight: formData.interactionWeight,
  responsibilityWeight: formData.responsibilityWeight,
  smokingPolicy: formData.smokingPolicy,
  smokingImportance: formData.smokingImportance,
  alcoholPolicy: formData.alcoholPolicy,
  alcoholImportance: formData.alcoholImportance,
  petsPolicy: formData.petsPolicy,
  petsImportance: formData.petsImportance,
  roommateType: formData.roommateType,
  behaviorStrictness: formData.behaviorStrictness,
  acceptSmoker: formData.acceptSmoker,
  acceptPets: formData.acceptPets,
  acceptGuests: formData.acceptGuests,
  minimumStayMonths:
    formData.minimumStayMonths && formData.minimumStayMonths > 0
      ? formData.minimumStayMonths
      : 1,
});
export type RoommateRequest = {
  _id: string;
  requesterId: string;
  targetUserId: string;
  propertyId?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;

  requester?: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };

  target?: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) return error.message;

  return "Request failed";
};

// KEY FIX: returns null when no profile exists so the page can show the picker
export const useMyRoommateProfile = (): UseQueryResult<
  RoommateProfile | null,
  Error
> => {
  return useQuery<RoommateProfile | null, Error>({
    queryKey: roommateQueryKeys.profile,
    queryFn: async () => {
      try {
        const res = await api.get<{ profile: RoommateProfile }>(
          "/api/roommate/profile",
        );
        return res.data.profile;
      } catch (error) {
        if (getStatusCode(error) === 404) {
          return null; // ← null = no profile yet = show picker
        }
        throw new Error(getErrorMessage(error));
      }
    },
    refetchOnWindowFocus: false,
  });
};

export const useUpdateRoommateProfile = (): UseMutationResult<
  RoommateProfile,
  Error,
  Partial<RoommateProfile>
> => {
  const queryClient = useQueryClient();

  return useMutation<RoommateProfile, Error, Partial<RoommateProfile>>({
    mutationFn: async (payload) => {
      try {
        const res = await api.put<{ profile: RoommateProfile }>(
          "/api/roommate/profile",
          payload,
        );

        return res.data.profile;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.profile,
      });
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.matches,
      });
    },
  });
};

export const useMyRoommatePreferences = (): UseQueryResult<
  RoommatePreferences,
  Error
> => {
  return useQuery<RoommatePreferences, Error>({
    queryKey: roommateQueryKeys.preferences,
    queryFn: async () => {
      try {
        const res = await api.get<{ preferences: RoommatePreferences }>(
          "/api/roommate/preferences",
        );

        return res.data.preferences;
      } catch (error) {
        if (getStatusCode(error) === 404) {
          return createDefaultRoommatePreferences();
        }

        throw new Error(getErrorMessage(error));
      }
    },
    refetchOnWindowFocus: false,
  });
};

export const useUpdateRoommatePreferences = (): UseMutationResult<
  RoommatePreferences,
  Error,
  Partial<RoommatePreferences>
> => {
  const queryClient = useQueryClient();

  return useMutation<RoommatePreferences, Error, Partial<RoommatePreferences>>({
    mutationFn: async (payload) => {
      try {
        const res = await api.put<{ preferences: RoommatePreferences }>(
          "/api/roommate/preferences",
          payload,
        );

        return res.data.preferences;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.preferences,
      });
    },
  });
};

export const useMyStoredMatches = (): UseQueryResult<
  RoommateMatchView[],
  Error
> => {
  return useQuery<RoommateMatchView[], Error>({
    queryKey: roommateQueryKeys.matches,
    queryFn: async () => {
      const res = await api.get<{ matches: RoommateMatchAPI[] }>(
        "/api/roommate/suggestions",
      );

      const raw = res.data.matches ?? [];

      return raw.map((m) => {
        const rp = m.targetRoommateProfile;
        const snapshot = m.snapshot?.targetProfile;

        const resolvedPropertyId =
          m.propertyId ||
          rp?.selectedPropertyId ||
          snapshot?.selectedPropertyId ||
          null;

        return {
          userId: m.targetUserId,
          targetUserId: m.targetUserId,
          matchScore: m.score,

          fullName: m.targetUserProfile?.fullName ?? snapshot?.fullName ?? "",

          profilePictureUrl: m.targetUserProfile?.profilePictureUrl ?? null,

          profileSummary: {
            profileType: rp?.profileType ?? snapshot?.profileType ?? null,
            occupation: rp?.occupation ?? snapshot?.occupation ?? "",
            currentStatus:
              rp?.currentStatus ?? snapshot?.currentStatus ?? "Student",

            budgetMin: rp?.budgetMin ?? snapshot?.budgetMin ?? 0,
            budgetMax: rp?.budgetMax ?? snapshot?.budgetMax ?? null,

            socialLevel: rp?.socialLevel ?? snapshot?.socialLevel ?? 3,
            cleanliness: rp?.cleanliness ?? snapshot?.cleanliness ?? 3,
            sleepSchedule: rp?.sleepSchedule ?? snapshot?.sleepSchedule ?? 3,
            noiseTolerance: rp?.noiseTolerance ?? snapshot?.noiseTolerance ?? 3,
            guests: rp?.guests ?? snapshot?.guests ?? 3,
            interactionLevel:
              rp?.interactionLevel ?? snapshot?.interactionLevel ?? 3,
            responsibility: rp?.responsibility ?? snapshot?.responsibility ?? 3,

            smoking: rp?.smoking ?? snapshot?.smoking ?? "no",
            drinking: rp?.drinking ?? snapshot?.drinking ?? "no",
            pets: rp?.pets ?? snapshot?.pets ?? "no",

            interests: snapshot?.interests ?? [],
            aboutMe: snapshot?.aboutMe ?? "",
            preferredLocations: snapshot?.preferredLocations ?? [],
            stayDurationMonths: snapshot?.stayDurationMonths ?? null,
          },

          propertyInfo: resolvedPropertyId
            ? {
                propertyId: resolvedPropertyId,
                title:
                  snapshot?.propertyTitle ??
                  snapshot?.title ??
                  "View listed room",
                city: snapshot?.propertyCity ?? snapshot?.city ?? null,
              }
            : null,

          roommateCount: m.roommateCount ?? null,
          leaseInfo: m.leaseInfo ?? null,
        };
      });
    },
  });
};
export const useRoommateRequests = () =>
  useQuery({
    queryKey: roommateQueryKeys.requests,
    queryFn: async () => {
      const res = await api.get<{
        incoming: RoommateRequest[];
        outgoing: RoommateRequest[];
      }>("/api/roommate/requests");

      return res.data;
    },
  });

export const useCreateRoommateRequest = (): UseMutationResult<
  RoommateRequest,
  Error,
  { targetUserId: string; propertyId?: string | null }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await api.post<{ request: RoommateRequest }>(
          "/api/roommate/requests",
          payload,
        );

        return res.data.request;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.requests,
      });
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.matches,
      });
    },
  });
};

export const useAcceptRoommateRequest = (): UseMutationResult<
  RoommateRequest,
  Error,
  { requestId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }) => {
      try {
        const res = await api.patch<{ request: RoommateRequest }>(
          `/api/roommate/requests/${requestId}/accept`,
        );

        return res.data.request;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.requests,
      });
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.matches,
      });
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.profile,
      });
    },
  });
};
export const useRejectRoommateRequest = (): UseMutationResult<
  RoommateRequest,
  Error,
  { requestId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }) => {
      try {
        const res = await api.patch<{ request: RoommateRequest }>(
          `/api/roommate/requests/${requestId}/reject`,
        );

        return res.data.request;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roommateQueryKeys.requests,
      });
    },
  });
};
export const useGenerateRoommateMatches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/api/roommate/suggestions/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roommate", "matches"] });
    },
  });
};
