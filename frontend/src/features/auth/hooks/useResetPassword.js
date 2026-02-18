import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await authClient.resetPassword(data);
      return res.data;
    },
  });
};
