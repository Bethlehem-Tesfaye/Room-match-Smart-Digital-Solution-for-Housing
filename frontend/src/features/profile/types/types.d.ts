export interface Profile {
  _id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: "user" | "admin";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetMyProfileResponse {
  profile: Profile;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string | null;
  imageUrl?: string;
  removeProfilePicture?: boolean;
}

export interface UpdateMyProfileResponse {
  message: string;
  profile: Profile;
}
