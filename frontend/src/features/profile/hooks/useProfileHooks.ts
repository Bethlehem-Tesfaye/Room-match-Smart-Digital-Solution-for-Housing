import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import type {
  GetMyProfileResponse,
  Profile,
  RequestUnblockResponse,
  UpdateMyProfileResponse,
  UpdateProfileInput,
} from "../types/types";

const profileQueryKeys = {
  me: ["profile", "me"] as const,
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) return error.message;

  return "Request failed";
};

const hasAnyUpdatableField = (
  payload: UpdateProfileInput | FormData,
): boolean => {
  if (payload instanceof FormData) {
    return Array.from(payload.keys()).length > 0;
  }

  return (
    payload.fullName !== undefined ||
    payload.phoneNumber !== undefined ||
    payload.imageUrl !== undefined ||
    payload.removeProfilePicture === true
  );
};

export const useMyProfile = (
  enabled = true,
): UseQueryResult<Profile, Error> => {
  return useQuery<Profile, Error>({
    queryKey: profileQueryKeys.me,
    enabled,
    queryFn: async () => {
      try {
        const res = await api.get<GetMyProfileResponse>("/api/profile");
        return res.data.profile;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useUpdateMyProfile = (): UseMutationResult<
  UpdateMyProfileResponse,
  Error,
  UpdateProfileInput | FormData
> => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateMyProfileResponse,
    Error,
    UpdateProfileInput | FormData
  >({
    mutationFn: async (payload) => {
      if (!hasAnyUpdatableField(payload)) {
        throw new Error("At least one profile field must be provided");
      }

      try {
        const res = await api.patch<UpdateMyProfileResponse>(
          "/api/profile",
          payload,
          payload instanceof FormData
            ? {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            : undefined,
        );

        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.me,
      });
    },
  });
};

export const useRequestUnblock = (): UseMutationResult<
  RequestUnblockResponse,
  Error,
  { reason?: string }
> => {
  return useMutation<RequestUnblockResponse, Error, { reason?: string }>({
    mutationFn: async ({ reason }) => {
      try {
        const res = await api.post<RequestUnblockResponse>(
          "/api/profile/request-unblock",
          { reason }
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};
