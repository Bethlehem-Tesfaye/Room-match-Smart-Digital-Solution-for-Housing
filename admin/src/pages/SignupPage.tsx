import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  promoteAdmin,
  rollbackAdminSignup,
  signInAdmin,
  signOutAdmin,
  signUpAdmin,
  validateAdminSecret,
} from "../lib/api";
import AuthLayout, {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthLink,
} from "../components/layout/AuthLayout";

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    let shouldRollback = false;

    try {
      await validateAdminSecret(adminSecret);

      const callbackURL = window.location.origin;
      let userId: string | null = null;

      try {
        const { user } = await signUpAdmin(name, email, password, callbackURL);
        userId = user?.id ?? null;
        shouldRollback = true;
      } catch (signupErr) {
        const signupMessage =
          signupErr instanceof Error ? signupErr.message : "";
        const emailAlreadyUsed = /already exists/i.test(signupMessage);

        if (!emailAlreadyUsed) {
          throw signupErr;
        }

        const signInResult = await signInAdmin(email, password);
        userId = signInResult.user?.id ?? null;

        if (!userId) {
          throw new Error(
            "An account with this email already exists. Sign in or use another email.",
          );
        }
      }

      if (!userId) {
        throw new Error("Failed to create admin account.");
      }

      await promoteAdmin(userId, adminSecret);
      await signOutAdmin().catch(() => undefined);

      setMessage("Admin account created. You can sign in now.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      if (shouldRollback) {
        await rollbackAdminSignup().catch(() => undefined);
      }
      await signOutAdmin().catch(() => undefined);
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create admin"
      subtitle="Register with your admin secret key."
      footer={
        <>
          Already registered? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}
      {error ? <AuthAlert>{error}</AuthAlert> : null}
      <form onSubmit={handleSubmit}>
        <AuthField id="name" label="Full name" value={name} onChange={setName} />
        <AuthField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
        />
        <AuthField
          id="adminSecret"
          label="Admin secret key"
          type="password"
          value={adminSecret}
          onChange={setAdminSecret}
        />
        <AuthButton disabled={isSubmitting}>
          {isSubmitting ? "Creating admin…" : "Create admin account"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
