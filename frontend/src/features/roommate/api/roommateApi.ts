import { api } from "../../../lib/axios";
import type {
  RoommatePreferences,
  RoommateSuggestionsResponse,
  PreferencesResponse,
  ProfileResponse,
  RoommateMatch,
  RoommateRequestsResponse,
  RoommateRequest,
} from "../types/roommateTypes";

const API_URL = "/api/roommate";

type StoredMatchesResponse = {
  matches: RoommateMatch[];
};

export const roommateApi = {
  getSuggestions: async (): Promise<RoommateSuggestionsResponse> => {
    const response = await api.get(`${API_URL}/suggestions`);
    return response.data;
  },

  getMatches: async (): Promise<StoredMatchesResponse> => {
    const response = await api.get("/api/match");
    return response.data;
  },

  getPreferences: async (): Promise<PreferencesResponse> => {
    const response = await api.get(`${API_URL}/preferences`);
    return response.data;
  },

  updateProfile: async (
    profile: Partial<RoommatePreferences>,
  ): Promise<ProfileResponse> => {
    const response = await api.put(`${API_URL}/profile`, profile);
    return response.data;
  },

  updatePreferences: async (
    preferences: Partial<RoommatePreferences>,
  ): Promise<PreferencesResponse> => {
    const response = await api.put(`${API_URL}/preferences`, preferences);
    return response.data;
  },

  getRequests: async (): Promise<RoommateRequestsResponse> => {
    const response = await api.get(`${API_URL}/requests`);
    return response.data;
  },

  createRequest: async (payload: {
    targetUserId: string;
    propertyId?: string | null;
  }): Promise<{ success: boolean; request: RoommateRequest }> => {
    const response = await api.post(`${API_URL}/requests`, payload);
    return response.data;
  },

  acceptRequest: async (
    requestId: string,
  ): Promise<{ success: boolean; request: RoommateRequest }> => {
    const response = await api.patch(`${API_URL}/requests/${requestId}/accept`);
    return response.data;
  },

  rejectRequest: async (
    requestId: string,
  ): Promise<{ success: boolean; request: RoommateRequest }> => {
    const response = await api.patch(`${API_URL}/requests/${requestId}/reject`);
    return response.data;
  },
};
