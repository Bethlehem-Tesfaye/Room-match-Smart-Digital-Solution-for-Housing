import type { ReactNode } from "react";

export type AuthLayoutProps = {
  children: ReactNode;
};

export type LoginFormState = {
  email: string;
  password: string;
};

export type RegistrationFormState = {
  name: string;
  email: string;
  password: string;
};

export type ResetPasswordFormProps = {
  token?: string;
};
