import { authClient } from "../../../lib/authClient";

interface User {
  id: string;
  email?: string;
  isAnonymous?: boolean | null;
  [key: string]: any;
}

interface UseCurrentUserReturn {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isRealUser: boolean;
}

export const useCurrentUser = (): UseCurrentUserReturn => {
  const { data: session, isPending } = authClient.useSession();

  const user: User | null = session?.user ?? null;

  const isAuthenticated = !!user;
  const isAnonymous = user?.isAnonymous === true;
  const isRealUser = !!user && user.isAnonymous === false;

  return {
    user,
    isPending,
    isAuthenticated,
    isAnonymous,
    isRealUser,
  };
};
