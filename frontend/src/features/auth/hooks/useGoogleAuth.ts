import { authClient } from "../../../lib/authClient";

export const useGoogleAuth = () => {
  return async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/dashboard`,
    });
  };
};
