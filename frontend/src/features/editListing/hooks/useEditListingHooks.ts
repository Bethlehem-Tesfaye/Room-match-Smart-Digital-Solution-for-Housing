import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import type { Property, UpdatePropertyInput } from "../../property/types/type";

const editListingQueryKeys = {
  byId: (propertyId: string) =>
    ["edit-listing", "property", propertyId] as const,
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

export const useEditListingProperty = (
  propertyId?: string,
): UseQueryResult<Property, Error> => {
  return useQuery<Property, Error>({
    queryKey: editListingQueryKeys.byId(propertyId ?? ""),
    enabled: !!propertyId,
    queryFn: async () => {
      try {
        const res = await api.get<{ property: Property }>(
          `/api/properties/${propertyId}`,
        );
        return res.data.property;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useUpdateEditListingProperty = (): UseMutationResult<
  Property,
  Error,
  { propertyId: string; payload: UpdatePropertyInput | FormData }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Property,
    Error,
    { propertyId: string; payload: UpdatePropertyInput | FormData }
  >({
    mutationFn: async ({ propertyId, payload }) => {
      try {
        const res = await api.patch<{ property: Property }>(
          `/api/properties/${propertyId}`,
          payload,
          payload instanceof FormData
            ? {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            : undefined,
        );

        return res.data.property;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: editListingQueryKeys.byId(variables.propertyId),
      });
      queryClient.invalidateQueries({
        queryKey: ["add-listing", "creator", "my-properties"],
      });
      queryClient.invalidateQueries({
        queryKey: ["properties", "creator", "mine"],
      });
    },
  });
};
