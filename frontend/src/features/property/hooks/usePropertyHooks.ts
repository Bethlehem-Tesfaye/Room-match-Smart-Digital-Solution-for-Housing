import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import type {
  Amenity,
  CreatePropertyInput,
  Property,
  SaveFavoriteInput,
  UpdatePropertyInput,
} from "../types/type";

const propertyQueryKeys = {
  browserList: ["properties", "browser"] as const,
  browserDetail: (id: string) => ["properties", "browser", id] as const,
  amenities: ["amenities"] as const,
  creatorMine: ["properties", "creator", "mine"] as const,
  creatorDetail: (id: string) => ["properties", "creator", id] as const,
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

export const useBrowserProperties = (): UseQueryResult<Property[], Error> => {
  return useQuery<Property[], Error>({
    queryKey: propertyQueryKeys.browserList,
    queryFn: async () => {
      const res = await api.get<{ properties: Property[] }>(
        "/api/properties/browser",
      );
      return res.data.properties;
    },
  });
};

export const useBrowserPropertyDetails = (
  propertyId?: string,
): UseQueryResult<Property, Error> => {
  return useQuery<Property, Error>({
    queryKey: propertyQueryKeys.browserDetail(propertyId ?? ""),
    enabled: !!propertyId,
    queryFn: async () => {
      const res = await api.get<{ property: Property }>(
        `/api/properties/browser/${propertyId}`,
      );
      return res.data.property;
    },
  });
};

export const useAmenities = (): UseQueryResult<Amenity[], Error> => {
  return useQuery<Amenity[], Error>({
    queryKey: propertyQueryKeys.amenities,
    queryFn: async () => {
      const res = await api.get<{ amenities: Amenity[] }>("/api/amenities");
      return res.data.amenities;
    },
  });
};

export const useMyProperties = (): UseQueryResult<Property[], Error> => {
  return useQuery<Property[], Error>({
    queryKey: propertyQueryKeys.creatorMine,
    queryFn: async () => {
      const res = await api.get<{ properties: Property[] }>(
        "/api/properties/my-properties",
      );
      return res.data.properties;
    },
  });
};

export const useCreatorPropertyDetails = (
  propertyId?: string,
): UseQueryResult<Property, Error> => {
  return useQuery<Property, Error>({
    queryKey: propertyQueryKeys.creatorDetail(propertyId ?? ""),
    enabled: !!propertyId,
    queryFn: async () => {
      const res = await api.get<{ property: Property }>(
        `/api/properties/${propertyId}`,
      );
      return res.data.property;
    },
  });
};

export const useCreateProperty = (): UseMutationResult<
  Property,
  Error,
  CreatePropertyInput
> => {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, CreatePropertyInput>({
    mutationFn: async (payload) => {
      try {
        const res = await api.post<{ property: Property }>(
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
        queryKey: propertyQueryKeys.creatorMine,
      });
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.browserList,
      });
    },
  });
};

export const useUpdateProperty = (): UseMutationResult<
  Property,
  Error,
  { propertyId: string; payload: UpdatePropertyInput }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Property,
    Error,
    { propertyId: string; payload: UpdatePropertyInput }
  >({
    mutationFn: async ({ propertyId, payload }) => {
      try {
        const res = await api.patch<{ property: Property }>(
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
        queryKey: propertyQueryKeys.creatorMine,
      });
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.creatorDetail(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.browserDetail(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.browserList,
      });
    },
  });
};

export const useDeleteProperty = (): UseMutationResult<
  void,
  Error,
  { propertyId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { propertyId: string }>({
    mutationFn: async ({ propertyId }) => {
      try {
        await api.delete(`/api/properties/${propertyId}`);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.creatorMine,
      });
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.browserList,
      });
    },
  });
};

export const useSaveFavorite = (): UseMutationResult<
  unknown,
  Error,
  SaveFavoriteInput
> => {
  return useMutation<unknown, Error, SaveFavoriteInput>({
    mutationFn: async ({ propertyId, notes }) => {
      try {
        const res = await api.post(
          `/api/properties/browser/${propertyId}/save-favorite`,
          {
            notes,
          },
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useRemoveFavorite = (): UseMutationResult<
  unknown,
  Error,
  { propertyId: string }
> => {
  return useMutation<unknown, Error, { propertyId: string }>({
    mutationFn: async ({ propertyId }) => {
      try {
        const res = await api.delete(
          `/api/properties/browser/${propertyId}/save-favorite`,
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};
