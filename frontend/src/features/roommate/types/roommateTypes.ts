export type RoommateType = "TYPE_A" | "TYPE_B";

export interface RoommatePreferences {
  profileType?: RoommateType;
  fullName?: RoommateType;
  selectedPropertyId?: string | null;
  currentStatus?: "Student" | "Employed" | "Self-employed" | "Other";
  occupation?: string;
  gender?: "male" | "female";
  lifestyleType?: string;
  socialLevel?: number;
  cleanliness?: number;
  sleepSchedule?: number;
  noiseTolerance?: number;
  guests?: number;
  interactionLevel?: number;
  responsibility?: number;
  smoking?: "yes" | "no";
  drinking?: "yes" | "no" | "sometimes";
  pets?: "yes" | "no";
  budgetMin: number;
  budgetMax: number | null;
  stayDurationMonths: number;
  leaseRemainingMonths?: number;
  updatedFrom?: "profile" | "preferences" | "matching";
  preferredCleanliness?: number;
  preferredSleepSchedule?: number;
  preferredNoiseTolerance?: number;
  preferredGuests?: number;
  preferredSocialAtmosphere?: number;
  preferredInteractionLevel?: number;
  preferredResponsibility?: number;
  cleanlinessWeight?: number;
  sleepWeight?: number;
  noiseWeight?: number;
  guestsWeight?: number;
  socialWeight?: number;
  interactionWeight?: number;
  responsibilityWeight?: number;
  smokingDealbreaker?: "yes" | "no" | "any";
  petsDealbreaker?: "yes" | "no" | "any";
  guestsDealbreaker?: "yes" | "no" | "any";
  smokingPolicy?: "not-allowed" | "allowed" | "outside-only";
  smokingImportance?: number;
  alcoholPolicy?: "not-allowed" | "occasionally" | "allowed";
  alcoholImportance?: number;
  petsPolicy?: "not-allowed" | "allowed" | "depends";
  petsImportance?: number;
  roommateType?:
    | "Very similar"
    | "Somewhat similar"
    | "Balanced"
    | "Different is fine";
  behaviorStrictness?: number;
  preferredRoommateGender?: "any" | "male" | "female";
  acceptSmoker?: "yes" | "no";
  acceptPets?: "yes" | "no";
  acceptGuests?: "yes" | "no";
  minimumStayMonths?: number;
  preferredLocations?: string[];
  moveInDate?: string | null;
  interests?: string[];
  aboutMe?: string;
  studyHabits?: number;
  temperature?: number;
  personality?: number;
  propertyTitle?: string;
  title?: string;
  propertyCity?: string;
  city?: string;
}

export interface RoommateProfile {
  userId: string;
  profileType: RoommateType;
  selectedPropertyId?: string | null;
  currentStatus?: "Student" | "Employed" | "Self-employed" | "Other";
  occupation?: string;
  gender?: "male" | "female";
  lifestyleType?: string;
  socialLevel?: number;
  cleanliness?: number;
  sleepSchedule?: number;
  noiseTolerance?: number;
  guests?: number;
  interactionLevel?: number;
  responsibility?: number;
  smoking?: "yes" | "no";
  drinking?: "yes" | "no" | "sometimes";
  pets?: "yes" | "no";
  budgetMin?: number;
  budgetMax?: number | null;
  stayDurationMonths?: number;
  leaseRemainingMonths?: number;
  updatedFrom?: "profile" | "preferences" | "matching";
}

export interface RoommateMatch {
  userId: string;
  name: string;
  email: string;
  fullName: string;
  profilePictureUrl: string | null;
  targetUserId: string;
  score: number;
  matchScore: number;

  // ── fix: was `string | null`, it's actually an object ──
  snapshot?: {
    targetProfile?: {
      budgetMin?: number;
      budgetMax?: number | null;
      drinking?: string;
      occupation?: string;
      stayDurationMonths?: number | null;
      interests?: string[];
      aboutMe?: string;
      preferredLocations?: string[];
      fullName?: string;
    };
    generatedAt?: string;
  } | null;

  profileSummary?: {
    occupation?: string;
    profileType?: string;
    lifestyleType?: string;
    socialLevel?: number;
    cleanliness?: number;
    sleepSchedule?: number;
    noiseTolerance?: number;
    guests?: number;
    responsibility?: number;
    smoking?: string;
    drinking?: string;
    pets?: string;
    budgetMin?: number;
    budgetMax?: number | null;
    stayDurationMonths?: number | null;
    interests?: string[];
    aboutMe?: string;
    preferredLocations?: string[];
  };

  targetUserProfile?: {
    fullName: string;
    profilePictureUrl: string | null;
    phoneNumber: string | null;
  } | null;
  propertyInfo?: {
    title: string;
    city?: string;
    address?: string;
    propertyId: string;
  } | null;
  roommateCount?: number | null;
  leaseInfo?: {
    leaseEndDate?: string | null;
    remainingDays?: number | null;
  } | null;
}

export interface RoommateMatchAPI extends RoommateMatch {
  targetRoommateProfile?: RoommateProfile | null;
  propertyId?: string | null;

  snapshot?: {
    targetProfile?: Partial<RoommatePreferences> & {
      selectedPropertyId?: string | null;
      profileType?: "TYPE_A" | "TYPE_B";
      currentStatus?: string;
      socialLevel?: number;
      cleanliness?: number;
      sleepSchedule?: number;
      noiseTolerance?: number;
      guests?: number;
      interactionLevel?: number;
      responsibility?: number;
      smoking?: "yes" | "no";
      pets?: "yes" | "no";
    };
    generatedAt?: string;
  } | null;
}
export interface RoommateMatchView {
  userId: string;
  targetUserId: string;
  fullName: string;
  profilePictureUrl: string | null;

  matchScore: number;

  profileSummary: {
    profileType: "TYPE_A" | "TYPE_B" | null;
    occupation: string;
    currentStatus: string;

    budgetMin: number;
    budgetMax: number | null;

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

    interests: string[];
    aboutMe: string;
    preferredLocations: string[];
    stayDurationMonths: number | null;
  };

  propertyInfo: {
    propertyId: string;
    title: string;
    city: string | null;
  } | null;

  roommateCount?: number | null;
  leaseInfo?: {
    leaseEndDate?: string | null;
    remainingDays?: number | null;
  } | null;
}

export interface RoommateRequest {
  _id: string;
  requesterId: string;
  targetUserId: string;
  propertyId?: string | null;
  roommateGroupId?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requester?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
  target?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

export interface RoommateSuggestionsResponse {
  success: boolean;
  currentUser: {
    userId: string;
    fullName: string;
    profileType?: RoommateType | null;
    selectedPropertyId?: string | null;
    preferences: RoommatePreferences;
  };
  matches: RoommateMatch[];
  totalMatches: number;
  message?: string;
}

export interface RoommateRequestsResponse {
  success: boolean;
  incoming: RoommateRequest[];
  outgoing: RoommateRequest[];
  message?: string;
}

export interface PreferencesResponse {
  success: boolean;
  preferences: RoommatePreferences;
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile: RoommateProfile;
  preferences?: RoommatePreferences;
  message?: string;
}
