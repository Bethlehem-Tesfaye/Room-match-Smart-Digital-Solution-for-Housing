import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authClient } from "../../../lib/authClient";
import { api } from "../../../lib/axios";
import type {
  ChangePasswordInput,
  LinkedAuthAccount,
  PasswordActionResponse,
  SetPasswordInput,
  ThemePreference,
} from "../types/types";

const THEME_STORAGE_KEY = "roommatch-theme";

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeError = error as { message?: string };
    if (maybeError.message) return maybeError.message;
  }

  return "Request failed";
};

const applyThemeToDocument = (theme: ThemePreference) => {
  if (typeof document === "undefined") return;
  const rootElement = document.documentElement;
  if (theme === "dark") {
    rootElement.classList.add("dark");
  } else {
    rootElement.classList.remove("dark");
  }
};

const readStoredTheme = (): ThemePreference => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark") return "dark";
  return "light";
};

const isCredentialProvider = (providerId: string): boolean => {
  const normalized = providerId.toLowerCase();
  return normalized === "credential" || normalized === "email";
};

const normalizeAccountsResponse = (response: unknown): LinkedAuthAccount[] => {
  if (Array.isArray(response)) {
    return response as LinkedAuthAccount[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: LinkedAuthAccount[] }).data;
  }

  return [];
};

export const useLinkedAccounts = (): UseQueryResult<
  LinkedAuthAccount[],
  Error
> => {
  return useQuery<LinkedAuthAccount[], Error>({
    queryKey: ["settings", "linked-accounts"],
    queryFn: async () => {
      try {
        const response = await authClient.$fetch("/list-accounts", {
          method: "GET",
        });

        return normalizeAccountsResponse(response);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useHasPasswordAccount = (): UseQueryResult<boolean, Error> => {
  return useQuery<boolean, Error>({
    queryKey: ["settings", "has-password-account"],
    queryFn: async () => {
      try {
        const response = await authClient.$fetch("/list-accounts", {
          method: "GET",
        });

        const accounts = normalizeAccountsResponse(response);
        return accounts.some((account) =>
          isCredentialProvider(account.providerId),
        );
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useChangePassword = (): UseMutationResult<
  PasswordActionResponse | null,
  Error,
  ChangePasswordInput
> => {
  return useMutation<PasswordActionResponse | null, Error, ChangePasswordInput>(
    {
      mutationFn: async ({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      }: ChangePasswordInput) => {
        try {
          const response = await authClient.changePassword({
            currentPassword,
            newPassword,
            ...(revokeOtherSessions !== undefined
              ? { revokeOtherSessions }
              : {}),
          });

          if (response.error) throw new Error(response.error.message);

          return response.data ?? null;
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
    },
  );
};

export const useSetPassword = (): UseMutationResult<
  PasswordActionResponse | null,
  Error,
  SetPasswordInput
> => {
  return useMutation<PasswordActionResponse | null, Error, SetPasswordInput>({
    mutationFn: async ({ newPassword }: SetPasswordInput) => {
      try {
        const response = await api.post<{
          message: string;
          data: PasswordActionResponse | null;
        }>("/api/settings/set-password", {
          newPassword,
        });

        return response.data.data ?? null;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useThemePreference = () => {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme());
  useEffect(() => {
    applyThemeToDocument(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);
  const setTheme = (nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
  };
  // resolvedTheme is always theme now
  return { theme, setTheme, resolvedTheme: theme };
};
