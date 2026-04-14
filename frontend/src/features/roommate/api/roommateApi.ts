import { api } from '../../../lib/axios';
import type {
    RoommatePreferences,
    RoommateSuggestionsResponse,
    PreferencesResponse
} from '../types/roommate.types';

const API_URL = '/api/roommate';

export const roommateApi = {
  getSuggestions: async (): Promise<RoommateSuggestionsResponse> => {
    const response = await api.get(`${API_URL}/suggestions`);
    return response.data;
  },

  getPreferences: async (): Promise<PreferencesResponse> => {
    const response = await api.get(`${API_URL}/preferences`);
    return response.data;
  },

  updatePreferences: async (preferences: Partial<RoommatePreferences>): Promise<PreferencesResponse> => {
    const response = await api.put(`${API_URL}/preferences`, preferences);
    return response.data;
  }
};