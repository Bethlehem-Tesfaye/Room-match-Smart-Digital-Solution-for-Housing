import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import type {
  CreatorDeletePropertyResponse,
  CreatorProperty,
  CreatorPropertyByIdResponse,
  CreatorPropertyListResponse,
  CreatorUpdatePropertyResponse,
  CreateCreatorPropertyInput,
  UpdateCreatorPropertyInput,
} from "../types/types";

const creatorPropertyQueryKeys = {
  mine: ["add-listing", "creator", "my-properties"] as const,
  byId: (propertyId: string) =>
    ["add-listing", "creator", "property", propertyId] as const,
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

export const useCreateCreatorProperty = (): UseMutationResult<
  CreatorProperty,
  Error,
  CreateCreatorPropertyInput
> => {
  const queryClient = useQueryClient();

  return useMutation<CreatorProperty, Error, CreateCreatorPropertyInput>({
    mutationFn: async (payload) => {
      try {
        const res = await api.post<CreatorPropertyByIdResponse>(
          "/api/properties",
          payload,
        );

        return res.data.property;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creatorPropertyQueryKeys.mine,
      });
    },
  });
};

export const useMyCreatorProperties = (): UseQueryResult<
  CreatorProperty[],
  Error
> => {
  return useQuery<CreatorProperty[], Error>({
    queryKey: creatorPropertyQueryKeys.mine,
    queryFn: async () => {
      const res = await api.get<CreatorPropertyListResponse>(
        "/api/properties/my-properties",
      );

      return res.data.properties;
    },
  });
};

export const useCreatorPropertyById = (
  propertyId?: string,
): UseQueryResult<CreatorProperty, Error> => {
  return useQuery<CreatorProperty, Error>({
    queryKey: creatorPropertyQueryKeys.byId(propertyId ?? ""),
    enabled: !!propertyId,
    queryFn: async () => {
      const res = await api.get<CreatorPropertyByIdResponse>(
        `/api/properties/${propertyId}`,
      );

      return res.data.property;
    },
  });
};

export const useUpdateCreatorProperty = (): UseMutationResult<
  CreatorProperty,
  Error,
  { propertyId: string; payload: UpdateCreatorPropertyInput }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    CreatorProperty,
    Error,
    { propertyId: string; payload: UpdateCreatorPropertyInput }
  >({
    mutationFn: async ({ propertyId, payload }) => {
      try {
        const res = await api.patch<CreatorUpdatePropertyResponse>(
          `/api/properties/${propertyId}`,
          payload,
        );

        return res.data.property;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: creatorPropertyQueryKeys.mine,
      });
      queryClient.invalidateQueries({
        queryKey: creatorPropertyQueryKeys.byId(variables.propertyId),
      });
    },
  });
};

export const useDeleteCreatorProperty = (): UseMutationResult<
  CreatorDeletePropertyResponse,
  Error,
  { propertyId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    CreatorDeletePropertyResponse,
    Error,
    { propertyId: string }
  >({
    mutationFn: async ({ propertyId }) => {
      try {
        const res = await api.delete<CreatorDeletePropertyResponse>(
          `/api/properties/${propertyId}`,
        );

        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creatorPropertyQueryKeys.mine,
      });
    },
  });
};
