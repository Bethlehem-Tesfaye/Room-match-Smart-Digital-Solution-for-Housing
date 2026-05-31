import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { promoteAdmin, signUpAdmin } from "../lib/api";

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

    try {
      const callbackURL = window.location.origin;
      const { user } = await signUpAdmin(name, email, password, callbackURL);
      if (!user?.id) {
        throw new Error("Failed to create admin account.");
      }
      await promoteAdmin(user.id, adminSecret);
      setMessage("Admin account created successfully. You can now login.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="heading">Admin Signup</h1>
        {message ? <div className="alert success">{message}</div> : null}
        {error ? <div className="alert">{error}</div> : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="adminSecret">Admin secret key</label>
            <input
              id="adminSecret"
              type="password"
              value={adminSecret}
              onChange={(event) => setAdminSecret(event.target.value)}
              required
            />
          </div>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating admin..." : "Create admin account"}
          </button>
        </form>
        <div className="link-row">
          <span>Already have an admin account?</span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
