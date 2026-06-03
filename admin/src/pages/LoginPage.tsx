import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInAdmin, signOutAdmin, verifyAdminAccess } from "../lib/api";
import AuthLayout, {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthLink,
} from "../components/layout/AuthLayout";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInAdmin(email, password);

      try {
        await verifyAdminAccess();
      } catch {
        await signOutAdmin().catch(() => undefined);
        setError(
          "This account does not have admin access. Sign in with an admin account or create one.",
        );
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access the RoomMatch admin control panel."
      footer={
        <>
          New admin? <AuthLink to="/signup">Create admin account</AuthLink>
        </>
      }
    >
      {error ? <AuthAlert>{error}</AuthAlert> : null}
      <form onSubmit={handleSubmit}>
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
        <AuthButton disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
