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

export interface AdminPropertyImage {
  _id: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface AdminPropertyRow {
  id: string;
  title: string;
  ownerName?: string;
  ownerEmail?: string;
  place?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  postedDate?: string;
}

export interface AdminPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminListQuery {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: string;
  role?: "admin" | "user";
}

export interface AdminPropertyDetail {
  _id: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  description: string;
  propertyType: string;
  price: number;
  currency: string;
  leasePeriod: number;
  initialPayment: number;
  address: string;
  city: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  floorNumber?: number | null;
  totalFloors?: number | null;
  areaSqFt?: number | null;
  isFurnished: boolean;
  availableFrom?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  images?: AdminPropertyImage[];
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const getErrorMessage = (payload: Record<string, unknown>) => {
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  if (
    payload?.error &&
    typeof payload.error === "object" &&
    typeof (payload.error as { message?: string }).message === "string"
  ) {
    return (payload.error as { message: string }).message;
  }
  return "Request failed. Please try again.";
};

const buildListQueryString = (params: AdminListQuery = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.searchField) searchParams.set("searchField", params.searchField);
  if (params.role) searchParams.set("role", params.role);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const handleResponse = async <T = any>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
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

export const verifyAdminAccess = async () => {
  const response = await fetch(`${apiUrl}/api/admin/me`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ isAdmin: boolean }>(response);
};

export const validateAdminSecret = async (adminSecret: string) => {
  const response = await fetch(`${apiUrl}/api/admin/validate-secret`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ adminSecret }),
  });
  return handleResponse<{ valid: boolean }>(response);
};

export const rollbackAdminSignup = async () => {
  const response = await fetch(`${apiUrl}/api/admin/signup-rollback`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ message: string }>(response);
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

export const getAdminUsers = async (params: AdminListQuery = {}) => {
  const response = await fetch(
    `${apiUrl}/api/admin/users${buildListQueryString(params)}`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    users: AdminUserRow[];
    pagination: AdminPaginationMeta;
  }>(response);
};

export const deleteAdminUser = async (id: string) => {
  const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ success: boolean }>(response);
};

export const signOutAdmin = async () => {
  const response = await fetch(`${apiUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse(response);
};

export const getAdminReports = async (
  params: Pick<AdminListQuery, "page" | "limit"> = {},
) => {
  const response = await fetch(
    `${apiUrl}/api/admin/reports${buildListQueryString(params)}`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    reports: AdminReport[];
    pagination: AdminPaginationMeta;
  }>(response);
};

export const markAdminReportsAsRead = async () => {
  const response = await fetch(`${apiUrl}/api/admin/reports/read-all`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{
    updatedCount: number;
    counts?: AdminNotificationCountResponse;
  }>(response);
};

export const getAdminSupportMessages = async (
  params: Pick<AdminListQuery, "page" | "limit"> = {},
) => {
  const response = await fetch(
    `${apiUrl}/api/admin/support-messages${buildListQueryString(params)}`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    messages: AdminSupportMessage[];
    pagination: AdminPaginationMeta;
  }>(response);
};

export const markAdminSupportMessagesAsRead = async () => {
  const response = await fetch(
    `${apiUrl}/api/admin/support-messages/read-all`,
    {
      method: "PATCH",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    updatedCount: number;
    counts?: AdminNotificationCountResponse;
  }>(response);
};

export const markAdminPropertyNotificationsAsRead = async () => {
  const response = await fetch(
    `${apiUrl}/api/admin/notifications/properties/read-all`,
    {
      method: "PATCH",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    updatedCount: number;
    counts?: AdminNotificationCountResponse;
  }>(response);
};

export interface AdminSupportMessage {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminScamReportUser {
  userId: string;
  name: string;
  email: string;
}

export interface AdminScamReport {
  id: string;
  reportType: "listing" | "user";
  reason: string;
  description: string;
  propertyId: string | null;
  propertyTitle: string | null;
  reporter: AdminScamReportUser;
  reported: AdminScamReportUser;
  createdAt: string;
}

export interface AdminUserScamSummary {
  user: AdminScamReportUser;
  status: string;
  blockedReason: string | null;
  listingReports: number;
  userReports: number;
  totalReports: number;
}

export interface AdminNotificationCountResponse {
  propertyNotifications: number;
  reportNotifications: number;
  supportNotifications: number;
  scamReportNotifications: number;
}

export const getAdminScamReports = async (
  params: Pick<AdminListQuery, "page" | "limit"> = {},
) => {
  const response = await fetch(
    `${apiUrl}/api/admin/scam-reports${buildListQueryString(params)}`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    reports: AdminScamReport[];
    pagination: AdminPaginationMeta;
  }>(response);
};

export const getAdminScamReport = async (reportId: string) => {
  const response = await fetch(`${apiUrl}/api/admin/scam-reports/${reportId}`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{
    report: AdminScamReport;
    reportedCounts: {
      listingReports: number;
      userReports: number;
      totalReports: number;
    };
  }>(response);
};

export const getAdminUserScamReportSummary = async (userId: string) => {
  const response = await fetch(
    `${apiUrl}/api/admin/users/${userId}/scam-report-summary`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<AdminUserScamSummary>(response);
};

export const markAdminScamReportsAsRead = async () => {
  const response = await fetch(`${apiUrl}/api/admin/scam-reports/read-all`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{
    updatedCount: number;
    counts?: AdminNotificationCountResponse;
  }>(response);
};

export const getAdminNotificationCounts = async () => {
  const response = await fetch(`${apiUrl}/api/admin/notifications/counts`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<AdminNotificationCountResponse>(response);
};

export const getAdminProperties = async (
  params: Omit<AdminListQuery, "role"> = {},
) => {
  const response = await fetch(
    `${apiUrl}/api/admin/properties${buildListQueryString(params)}`,
    {
      method: "GET",
      headers: defaultHeaders,
      credentials: "include",
    },
  );
  return handleResponse<{
    properties: AdminPropertyRow[];
    pagination: AdminPaginationMeta;
  }>(response);
};

export const getAdminProperty = async (id: string) => {
  const response = await fetch(`${apiUrl}/api/admin/properties/${id}`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ property: AdminPropertyDetail }>(response);
};

export const createAdminProperty = async (payload: Record<string, any>) => {
  const response = await fetch(`${apiUrl}/api/admin/properties`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<{ property: AdminPropertyDetail }>(response);
};

export const updateAdminProperty = async (
  id: string,
  payload: Record<string, any> | FormData,
) => {
  const requestInit: RequestInit = {
    method: "PATCH",
    credentials: "include",
  };

  if (payload instanceof FormData) {
    requestInit.body = payload;
  } else {
    requestInit.headers = defaultHeaders;
    requestInit.body = JSON.stringify(payload);
  }

  const response = await fetch(
    `${apiUrl}/api/admin/properties/${id}`,
    requestInit,
  );
  return handleResponse<{ property: AdminPropertyDetail }>(response);
};

export const deleteAdminProperty = async (id: string) => {
  const response = await fetch(`${apiUrl}/api/admin/properties/${id}`, {
    method: "DELETE",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<{ success: boolean }>(response);
};

export interface UnreadNotificationCountsResponse {
  total: number;
  byConversation?: Record<string, number>;
}

export const setUserBlockedStatus = async (
  userId: string,
  blocked: boolean,
  reason?: string,
) => {
  const response = await fetch(`${apiUrl}/api/admin/users/${userId}/blocked`, {
    method: "PATCH",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ blocked, reason }),
  });
  return handleResponse<{
    userId: string;
    blocked: boolean;
    reason?: string | null;
  }>(response);
};

export const getUnreadNotificationCounts = async () => {
  const response = await fetch(`${apiUrl}/api/notifications/unread-counts`, {
    method: "GET",
    headers: defaultHeaders,
    credentials: "include",
  });
  return handleResponse<UnreadNotificationCountsResponse>(response);
};
