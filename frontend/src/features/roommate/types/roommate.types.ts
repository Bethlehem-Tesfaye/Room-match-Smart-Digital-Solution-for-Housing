export interface RoommatePreferences {
  cleanliness: number;
  sleepSchedule: number;
  noiseTolerance: number;
  guests: number;
  studyHabits: number;
  temperature: number;
  personality: number;
  smoking: 'yes' | 'no';
  pets: 'yes' | 'no';
}

export interface RoommateMatch {
  userId: string;
  name: string;
  email: string;
  fullName: string;
  profilePictureUrl: string | null;
  matchScore: number;
}

export interface RoommateSuggestionsResponse {
  success: boolean;
  currentUser: {
    userId: string;
    fullName: string;
    preferences: RoommatePreferences;
  };
  matches: RoommateMatch[];
  totalMatches: number;
  message?: string;
}

export interface PreferencesResponse {
  success: boolean;
  preferences: RoommatePreferences;
  message?: string;
}