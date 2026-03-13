import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { toast } from "sonner";

interface ResendVerifyInput {
  email: string;
  callbackURL: string;
}

export const useResendVerify = (): UseMutationResult<
  void,
  Error,
  ResendVerifyInput
> =>
  useMutation<void, Error, ResendVerifyInput>({
    mutationFn: async ({
      email,
      callbackURL,
    }: ResendVerifyInput): Promise<void> => {
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Verification email resent successfully!");
    },
    onError: (err: Error) => {
      const msg =
        (err as any)?.message ||
        (err as any)?.response?.data?.message ||
        "Failed to resend verification email.";
      toast.error(String(msg));
    },
  });
