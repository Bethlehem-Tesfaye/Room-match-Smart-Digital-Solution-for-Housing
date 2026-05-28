export interface AuthResponse {
  token?: string | null;
  user?: { id: string; email: string; name: string; [key: string]: any };
  [key: string]: any;
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const handleResponse = async (response: Response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed. Please try again.");
  }
  return payload as AuthResponse;
};

export const signInAdmin = async (email: string, password: string) => {
  const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
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
  return handleResponse(response);
};

export const promoteAdmin = async (userId: string, adminSecret: string) => {
  const response = await fetch(`${apiUrl}/api/admin/promote`, {
    method: "POST",
    headers: defaultHeaders,
    credentials: "include",
    body: JSON.stringify({ userId, adminSecret }),
  });
  return handleResponse(response);
};
