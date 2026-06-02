import { authClient } from "../../../lib/authClient";

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface UseCurrentUserReturn {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
}

export const useCurrentUser = (): UseCurrentUserReturn => {
  const { data: session, isPending } = authClient.useSession();

  const user: User | null = session?.user ?? null;

  const isAuthenticated = !!user;

  return {
    user,
    isPending,
    isAuthenticated,
  };
};
