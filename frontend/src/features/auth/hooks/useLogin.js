import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.user.email}!`);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed, try again");
    },
  });

  return {
    login: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
};
