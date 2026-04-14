import { useState, useEffect, useCallback } from 'react';
import { roommateApi } from '../api/roommateApi';
import type { RoommatePreferences, RoommateMatch } from '../types/roommate.types';


export const useRoommate = () => {
  const [preferences, setPreferences] = useState<RoommatePreferences | null>(null);
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [currentUser, setCurrentUser] = useState<{ userId: string; fullName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggestions, prefs] = await Promise.all([
        roommateApi.getSuggestions(),
        roommateApi.getPreferences()
      ]);

      if (suggestions.success) {
        setMatches(suggestions.matches);
        setCurrentUser(suggestions.currentUser);
      }
      if (prefs.success) {
        setPreferences(prefs.preferences);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roommate data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = async (newPreferences: Partial<RoommatePreferences>) => {
    try {
      const response = await roommateApi.updatePreferences(newPreferences);
      if (response.success && response.preferences) {
        setPreferences(response.preferences);
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    preferences,
    matches,
    currentUser,
    loading,
    error,
    updatePreferences,
    refresh: loadData
  };
};