import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useRegister = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({ name, email, password, callbackURL }) => {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL,
      });

      if (res.error) throw new Error(res.error.message);
      return res.data; // { user, session? }
    },
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.user.email}! Please verify your email.`);
      navigate("/verify-notice");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed, please try again.");
    },
  });

  return {
    register: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
};
