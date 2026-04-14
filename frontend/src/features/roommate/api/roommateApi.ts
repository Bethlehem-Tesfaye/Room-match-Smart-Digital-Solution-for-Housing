import { api } from '../../../lib/axios';
import type { RoommatePreferences, RoommateSuggestionsResponse, PreferencesResponse } from '../types/roommate.types';

const API_URL = '/api/roommate';

export const roommateApi = {
  // Get roommate suggestions
  getSuggestions: async (): Promise<RoommateSuggestionsResponse> => {
    const response = await api.get(`${API_URL}/suggestions`);
    return response.data;
  },

  // Get current user's preferences
  getPreferences: async (): Promise<PreferencesResponse> => {
    const response = await api.get(`${API_URL}/preferences`);
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<RoommatePreferences>): Promise<PreferencesResponse> => {
    const response = await api.put(`${API_URL}/preferences`, preferences);
    return response.data;
  }
};