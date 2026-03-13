import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";

interface ForgotPasswordInput {
  email: string;
  redirectTo: string;
}

interface ForgotPasswordResponse {
  status: boolean;
  message: string;
}

export const useForgotPassword = (): UseMutationResult<
  ForgotPasswordResponse | null,
  Error,
  ForgotPasswordInput
> => {
  return useMutation<ForgotPasswordResponse | null, Error, ForgotPasswordInput>(
    {
      mutationFn: async (data: ForgotPasswordInput) => {
        const res = await authClient.requestPasswordReset(data);
        return res.data ?? null;
      },
    },
  );
};
