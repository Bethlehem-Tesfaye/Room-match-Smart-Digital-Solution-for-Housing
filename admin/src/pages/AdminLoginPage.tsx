import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { toast } from "sonner";


export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/auth/sign-in/email", {
        email,
        password,
      });

      if (response.data) {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, var(--palette-page-bg) 0%, var(--palette-light-purple) 100%)",
        color: "var(--palette-deep)"
      }}
    >
      <div
        className="rounded-lg shadow-xl p-8 w-full max-w-md"
        style={{ background: "var(--palette-card-bg)", border: "1px solid var(--palette-border)" }}
      >
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "var(--palette-purple)" }}>Room Match</h1>
        <p className="text-center text-muted mb-8">Admin Portal</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--palette-deep)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: "var(--palette-border)", background: "var(--palette-input-bg)", color: "var(--palette-deep)" }}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--palette-deep)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: "var(--palette-border)", background: "var(--palette-input-bg)", color: "var(--palette-deep)" }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-lg font-semibold disabled:opacity-60 transition"
            style={{ background: "var(--palette-purple)", border: "1px solid var(--palette-purple)" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--palette-deep)" }}>
          Only authorized admins can access this portal.
        </p>
      </div>
    </div>
  );
}
