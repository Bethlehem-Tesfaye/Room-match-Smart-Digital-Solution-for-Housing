import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useResetPassword } from "../hooks/useResetPassword";
import type { ResetPasswordFormProps } from "../types/type";
import { palette } from "../../../theme/palette";

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing or invalid token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetPassword.mutate(
      { newPassword, token },
      {
        onSuccess: () => {
          toast.success("Password successfully reset!");
          navigate("/login");
        },
        onError: (err: Error) => {
          toast.error(err?.message || "Failed to reset password.");
        },
      },
    );
  };

  const showMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div
      className="w-full max-w-2xl border rounded-xl p-6 shadow-sm"
      style={{
        borderColor: palette.lightPurple,
        backgroundColor: palette.cardBg,
      }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: palette.deep }}>
          Reset Password
        </h2>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Enter your new password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="new-password"
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            className="w-full border rounded-md px-3 py-2 focus:ring-2 outline-none"
            style={{
              borderColor: palette.border,
              color: palette.deep,
              backgroundColor: palette.inputBg,
              boxShadow: "none",
            }}
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="confirm-password"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="w-full border rounded-md px-3 py-2 focus:ring-2 outline-none"
            style={{
              borderColor: palette.border,
              color: palette.deep,
              backgroundColor: palette.inputBg,
              boxShadow: "none",
            }}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {showMismatch && (
            <p className="text-sm text-red-600 mt-1">Passwords do not match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full text-white rounded-md py-2 font-semibold transition-colors disabled:opacity-60"
          style={{ backgroundColor: palette.purple }}
        >
          {resetPassword.isPending ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <Link
        to="/login"
        className="block text-center text-sm font-medium mt-4 hover:underline"
        style={{ color: palette.purple }}
      >
        Back to login
      </Link>
    </div>
  );
}

export default ResetPasswordForm;
