import { useState, useEffect, useCallback } from "react";
import { roommateApi } from "../api/roommateApi";
import type {
  RoommatePreferences,
  RoommateMatch,
  RoommateRequestsResponse,
} from "../types/roommateTypes";

export const useRoommate = () => {
  const [preferences, setPreferences] = useState<RoommatePreferences | null>(
    null,
  );
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [requests, setRequests] = useState<RoommateRequestsResponse | null>(
    null,
  );
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    fullName: string;
    profileType?: "TYPE_A" | "TYPE_B" | null;
    selectedPropertyId?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prefs, requestsResponse] = await Promise.all([
        roommateApi.getPreferences(),
        roommateApi.getRequests(),
      ]);

      if (prefs.success) {
        setPreferences(prefs.preferences);
      }
      if (requestsResponse.success) {
        setRequests(requestsResponse);
      }

      const savedPreferences = prefs.preferences as RoommatePreferences & {
        userId?: string;
      };

      if (!savedPreferences.userId) {
        setMatches([]);
        setCurrentUser(null);
        return;
      }

      const matchesResponse = await roommateApi.getMatches();
      setMatches(matchesResponse.matches ?? []);
      setCurrentUser({
        userId: savedPreferences.userId,
        fullName: "You",
        profileType: savedPreferences.profileType ?? null,
        selectedPropertyId: savedPreferences.selectedPropertyId ?? null,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load roommate data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = async (
    newPreferences: Partial<RoommatePreferences>,
  ) => {
    try {
      const response = await roommateApi.updatePreferences(newPreferences);
      if (response.success && response.preferences) {
        setPreferences(response.preferences);
      }
      return response;
    } catch (err: unknown) {
      throw err;
    }
  };

  const updateProfile = async (newProfile: Partial<RoommatePreferences>) => {
    try {
      const response = await roommateApi.updateProfile(newProfile);
      return response;
    } catch (err: unknown) {
      throw err;
    }
  };

  const createRequest = async (payload: {
    targetUserId: string;
    propertyId?: string | null;
  }) => {
    return roommateApi.createRequest(payload);
  };

  const acceptRequest = async (requestId: string) => {
    return roommateApi.acceptRequest(requestId);
  };

  const rejectRequest = async (requestId: string) => {
    return roommateApi.rejectRequest(requestId);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    preferences,
    matches,
    requests,
    currentUser,
    loading,
    error,
    updateProfile,
    updatePreferences,
    createRequest,
    acceptRequest,
    rejectRequest,
    refresh: loadData,
  };
};
