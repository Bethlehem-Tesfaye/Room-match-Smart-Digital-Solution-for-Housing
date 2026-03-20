import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const useLogin = () => {
  const navigate = useNavigate();

  const mutation: UseMutationResult<LoginResponse, Error, LoginInput> =
    useMutation<LoginResponse, Error, LoginInput>({
      mutationFn: async ({ email, password }: LoginInput) => {
        const res = await authClient.signIn.email({ email, password });

        if (res.error) throw new Error(res.error.message);
        return res.data!;
      },
      onSuccess: (data) => {
        toast.success(`Welcome back, ${data.user.email}!`);
        navigate("/");
      },
      onError: (error: Error) => {
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
