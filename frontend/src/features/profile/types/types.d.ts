export interface BankInfo {
  accountName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  chapaSubaccountId: string | null;
}

export interface Profile {
  _id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  bankInfo: BankInfo | null;
  profilePictureUrl: string | null;
  role: "user" | "admin";
  deletedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetMyProfileResponse {
  profile: Profile;
}

export interface AccountStatusResponse {
  blocked: boolean;
  message: string | null;
  blockedReason: string | null;
}

export interface RequestUnblockResponse {
  message: string;
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
