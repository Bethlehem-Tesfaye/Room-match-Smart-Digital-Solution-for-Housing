import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { toast } from "sonner";

export const useResendVerify = () =>
  useMutation({
    mutationFn: async ({ email, callbackURL }) => {
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Verification email resent successfully!");
    },
    onError: (err) => {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to resend verification email.";
      toast.error(String(msg));
    },
  });
