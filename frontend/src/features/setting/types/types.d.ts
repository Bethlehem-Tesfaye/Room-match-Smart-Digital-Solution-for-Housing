export type ThemePreference = "light" | "dark" | "system";

export interface LinkedAuthAccount {
  id: string;
  providerId: string;
  accountId: string;
  userId: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface SetPasswordInput {
  newPassword: string;
}

export interface PasswordActionResponse {
  status?: boolean;
  token?: string | null;
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
}
