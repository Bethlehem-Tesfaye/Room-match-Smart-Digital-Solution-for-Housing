export interface AuthResponse {
  token?: string | null;
  user?: { id: string; email: string; name: string; [key: string]: any };
  [key: string]: any;
}

export interface AdminSummaryResponse {
  totalUsers: number;
  owners: number;
  tenants: number;
  properties: number;
  activeListings: number;
  roommateProfiles: number;
  totalAdmins?: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  joined: string;
  status: string;
  reason?: string | null;
}

export interface AdminReport {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const handleResponse = async <T = any>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed. Please try again.");
  }
  return payload as T;
};

export const signInAdmin = async (email: string, password: string) => {
  const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(response);
};

export const signUpAdmin = async (
  name: string,
  email: string,
  password: string,
  callbackURL: string | null = null,
) => {
  const body = { name, email, password } as Record<string, any>;
  if (callbackURL) body.callbackURL = callbackURL;

  const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse<AuthResponse>(response);
};

export const promoteAdmin = async (userId: string, adminSecret: string) => {
  const response = await fetch(`${apiUrl}/api/admin/promote`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ userId, adminSecret }),
  });
  return handleResponse<AuthResponse>(response);
};

export const getAdminDashboardSummary = async () => {
  const response = await fetch(`${apiUrl}/api/admin/summary`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<AdminSummaryResponse>(response);
};

export const getAdminUsers = async () => {
  const response = await fetch(`${apiUrl}/api/admin/users`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ users: AdminUserRow[] }>(response);
};

export const getAdminReports = async () => {
  const response = await fetch(`${apiUrl}/api/admin/reports`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ reports: AdminReport[] }>(response);
};

export const setUserBlockedStatus = async (
  userId: string,
  blocked: boolean,
  reason?: string
) => {
  const response = await fetch(`${apiUrl}/api/admin/users/${userId}/blocked`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ blocked, reason }),
  });
  return handleResponse<{ userId: string; blocked: boolean; reason?: string | null }>(response);
};
