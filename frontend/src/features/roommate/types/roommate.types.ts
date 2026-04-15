export interface RoommatePreferences {
  // Existing fields
  cleanliness: number;
  sleepSchedule: number;
  noiseTolerance: number;
  guests: number;
  studyHabits: number;
  temperature: number;
  personality: number;
  smoking: 'yes' | 'no';
  pets: 'yes' | 'no';
  
  // New hard filter fields
  budgetMin: number;
  budgetMax: number;
  preferredLocations: string[];
  moveInDate: string | null;
  stayDurationMonths: number;
  drinking: 'yes' | 'no' | 'sometimes';
  
  // New soft filter fields
  occupation: 'student' | 'working' | 'remote' | 'hybrid' | 'unemployed';
  interests: string[];
  aboutMe: string;
}

export interface RoommateMatch {
  userId: string;
  name: string;
  email: string;
  fullName: string;
  profilePictureUrl: string | null;
  matchScore: number;
  // New fields
  budgetMin: number;
  budgetMax: number;
  preferredLocations: string[];
  moveInDate: string | null;
  stayDurationMonths: number;
  drinking: 'yes' | 'no' | 'sometimes';
  occupation: 'student' | 'working' | 'remote' | 'hybrid' | 'unemployed';
  interests: string[];
  aboutMe: string;
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