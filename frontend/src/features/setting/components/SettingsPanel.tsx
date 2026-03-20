import {
  AlertTriangle,
  KeyRound,
  LogOut,
  Moon,
  Monitor,
  Sun,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLogout } from "../../auth/hooks/useLogout";
import { palette } from "../../../theme/palette";
import {
  useChangePassword,
  useHasPasswordAccount,
  useSetPassword,
  useThemePreference,
} from "../hooks/useSettingHooks";
import type { ThemePreference } from "../types/types";

function SettingsPanel() {
  const { data: hasPassword = false, isLoading: isPasswordModeLoading } =
    useHasPasswordAccount();
  const { theme, setTheme } = useThemePreference();

  const changePasswordMutation = useChangePassword();
  const setPasswordMutation = useSetPassword();
  const logoutMutation = useLogout();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const themeOptions: Array<{
    value: ThemePreference;
    label: string;
    icon: typeof Sun;
  }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const isPasswordMutationPending =
    changePasswordMutation.isPending || setPasswordMutation.isPending;

  const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all required password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password must match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (hasPassword) {
      if (!currentPassword) {
        toast.error("Current password is required.");
        return;
      }

      changePasswordMutation.mutate(
        {
          currentPassword,
          newPassword,
        },
        {
          onSuccess: () => {
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to change password.");
          },
        },
      );

      return;
    }

    setPasswordMutation.mutate(
      {
        newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password added successfully.");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to add password.");
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-bold" style={{ color: palette.deep }}>
        Settings
      </h1>
      <p className="mt-1 text-lg" style={{ color: palette.purple }}>
        Manage your account security and preferences.
      </p>

      <div className="mt-6 space-y-6">
        <article
          className="rounded-2xl border bg-white p-6 shadow-sm md:p-8"
          //   style={{ borderColor: palette.lightPurple }}
        >
          <div className="flex items-center gap-2">
            <KeyRound size={20} style={{ color: palette.purple }} />
            <h2
              className="text-xl font-semibold"
              style={{ color: palette.deep }}
            >
              Account Security
            </h2>
          </div>

          <p className="mt-2 text-sm" style={{ color: palette.purple }}>
            {isPasswordModeLoading
              ? "Checking authentication method..."
              : hasPassword
                ? "Change your current password."
                : "You signed in with Google. Add a password for email login."}
          </p>

          <form onSubmit={onSubmitPassword} className="mt-5 space-y-4">
            {hasPassword ? (
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: palette.deep }}
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none"
                  style={{
                    borderColor: palette.lightPurple,
                    color: palette.deep,
                  }}
                  placeholder="Enter current password"
                />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                {hasPassword ? "New Password" : "Add Password"}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none"
                style={{
                  borderColor: palette.lightPurple,
                  color: palette.deep,
                }}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
                style={{ color: palette.deep }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none"
                style={{
                  borderColor: palette.lightPurple,
                  color: palette.deep,
                }}
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={isPasswordMutationPending || isPasswordModeLoading}
              className="w-full cursor-pointer rounded-lg py-3 text-center font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: `linear-gradient(90deg, ${palette.softPurple} 0%, ${palette.purple} 100%)`,
              }}
            >
              {isPasswordMutationPending
                ? hasPassword
                  ? "Changing Password..."
                  : "Adding Password..."
                : hasPassword
                  ? "Change Password"
                  : "Add Password"}
            </button>
          </form>
        </article>

        <article
          className="rounded-2xl border bg-white p-6 shadow-sm md:p-8"
          style={{ borderColor: palette.lightPurple }}
        >
          <h2 className="text-xl font-semibold" style={{ color: palette.deep }}>
            Appearance
          </h2>
          <p className="mt-2 text-sm" style={{ color: palette.purple }}>
            Choose your theme preference.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition"
                  style={{
                    borderColor: isActive
                      ? palette.purple
                      : palette.lightPurple,
                    color: isActive ? palette.cardMutedBg : palette.deep,
                    backgroundColor: isActive
                      ? palette.purple
                      : palette.sectionBg,
                  }}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </article>

        <article
          className="rounded-2xl border bg-white p-6 shadow-sm md:p-8"
          style={{ borderColor: "#FECACA" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
          </div>
          <p className="mt-2 text-sm text-red-500">
            Sign out from your current session.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut size={16} />
            {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
          </button>
        </article>
      </div>
    </section>
  );
}

export default SettingsPanel;
