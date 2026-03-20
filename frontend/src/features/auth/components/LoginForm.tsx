import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import type { LoginFormState } from "../types/type";
import { palette } from "../../../theme/palette";

function LoginForm() {
  const { login, isLoading } = useLogin();
  const signInWithGoogle = useGoogleAuth();

  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((s) => ({ ...s, [id]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: palette.deep }}>
          Welcome back
        </h2>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Enter your credentials to access RoomMatch.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex-1 border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
          style={{ borderColor: palette.border, color: palette.deep }}
        >
          <span
            className="h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold"
            style={{ borderColor: palette.lightPurple, color: palette.purple }}
          >
            G
          </span>
          Continue with Google
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
        <span className="text-xs" style={{ color: palette.purple }}>
          OR CONTINUE WITH
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: palette.purple }}
            />
            <input
              id="email"
              type="email"
              className="w-full border rounded-md pl-9 pr-3 py-2"
              style={{
                borderColor: palette.border,
                color: palette.deep,
                backgroundColor: palette.inputBg,
              }}
              placeholder="you@roommatch.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs cursor-pointer"
              style={{ color: palette.purple }}
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: palette.purple }}
            />
            <input
              id="password"
              type="password"
              className="w-full border rounded-md pl-9 pr-3 py-2"
              style={{
                borderColor: palette.border,
                color: palette.deep,
                backgroundColor: palette.inputBg,
              }}
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-white cursor-pointer rounded-md py-2 font-semibold disabled:opacity-60"
          style={{ backgroundColor: palette.purple }}
        >
          {isLoading ? "Signing in..." : "Sign in to RoomMatch"}
        </button>
      </form>

      <p className="text-sm mt-6 text-center" style={{ color: palette.softPurple }}>
        Don’t have an account?{" "}
        <Link
          to="/register"
          className="font-medium cursor-pointer"
          style={{ color: palette.purple }}
        >
          Create an account
        </Link>
      </p>
    </>
  );
}

export default LoginForm;
