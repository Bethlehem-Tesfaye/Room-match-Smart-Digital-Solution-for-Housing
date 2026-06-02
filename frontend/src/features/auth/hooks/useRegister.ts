import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { authClient } from "../../../lib/authClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  callbackURL: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
  session?: {
    [key: string]: any;
  };
}

export const useRegister = () => {
  const navigate = useNavigate();

  const mutation: UseMutationResult<RegisterResponse, Error, RegisterInput> =
    useMutation<RegisterResponse, Error, RegisterInput>({
      mutationFn: async ({
        name,
        email,
        password,
        callbackURL,
      }: RegisterInput) => {
        const res = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL,
        });

        if (res.error) throw new Error(res.error.message);
        return res.data!;
      },
      onSuccess: (data) => {
        toast.success(`Welcome, ${data.user.email}! Please verify your email.`);
        navigate("/verify-notice");
      },
      onError: (error: Error) => {
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
