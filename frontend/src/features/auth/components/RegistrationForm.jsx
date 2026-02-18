import { Mail, Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useRegister } from "../hooks/useRegister";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

function RegistrationForm() {
  const { register, isLoading } = useRegister();
  const signInWithGoogle = useGoogleAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChange = (e) => {
    setForm((s) => ({ ...s, [e.target.id]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await register({
      ...form,
      callbackURL: `${window.location.origin}/verify-email`,
    });
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-sm text-gray-500">
          Join RoomMatch to find your perfect roommate.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex-1 cursor-pointer border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold text-[#7C67E4FF]">
            G
          </span>
          Continue with Google
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-[#7C67E4FF]">OR CONTINUE WITH</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Full Name
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C67E4FF]"
            />
            <input
              id="name"
              type="text"
              className="w-full border rounded-md pl-9 pr-3 py-2"
              placeholder="Your name"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C67E4FF]"
            />
            <input
              id="email"
              type="email"
              className="w-full border rounded-md pl-9 pr-3 py-2"
              placeholder="you@roommatch.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C67E4FF]"
            />
            <input
              id="password"
              type="password"
              className="w-full border rounded-md pl-9 pr-3 py-2"
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
          className="w-full bg-[#7C67E4FF] text-white rounded-md py-2 font-semibold disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6 text-center">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#7C67E4FF] font-medium cursor-pointer"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export default RegistrationForm;
