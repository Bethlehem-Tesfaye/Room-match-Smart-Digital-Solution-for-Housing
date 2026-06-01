import { AlertTriangle, KeyRound, LogOut, Moon, Sun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLogout } from "../../auth/hooks/useLogout";
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
        { currentPassword, newPassword },
        {
          onSuccess: () => {
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
          onError: (error) =>
            toast.error(error.message || "Failed to change password."),
        },
      );
      return;
    }
    setPasswordMutation.mutate(
      { newPassword },
      {
        onSuccess: () => {
          toast.success("Password added successfully.");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (error) =>
          toast.error(error.message || "Failed to add password."),
      },
    );
  };

  // ── Style tokens ────────────────────────────────────────────────────────
  const deep = "var(--palette-deep)";
  const muted = "var(--palette-soft-purple)";
  const border = "var(--palette-border)";
  const cardBg = "var(--palette-card-bg)";
  const mutedBg = "var(--palette-card-muted-alt-bg)";
  const chipBg = "var(--palette-chip-bg)";
  const inputBg = "var(--palette-input-bg)";
  const accent = "#8b64c8";

  const inputClass =
    "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition";
  const inputStyle = {
    borderColor: border,
    color: deep,
    backgroundColor: inputBg,
  };

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-widest";

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <p
          className="mb-1 text-xs uppercase tracking-widest"
          style={{ color: muted }}
        >
          Account
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: deep }}>
          Settings
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: muted }}>
          Manage your security and preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* ── Security card ── */}
        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          {/* Card header */}
          <div
            className="flex items-center gap-2.5 border-b px-6 py-4"
            style={{ borderColor: border, backgroundColor: mutedBg }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: chipBg }}
            >
              <KeyRound size={14} style={{ color: accent }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: deep }}>
                Account security
              </h2>
              <p className="text-xs" style={{ color: muted }}>
                {isPasswordModeLoading
                  ? "Checking authentication method…"
                  : hasPassword
                    ? "Change your current password."
                    : "You signed in with Google. Add a password for email login."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmitPassword} className="space-y-4 px-6 py-5">
            {hasPassword && (
              <div>
                <label
                  htmlFor="currentPassword"
                  className={labelClass}
                  style={{ color: muted }}
                >
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter current password"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className={labelClass}
                style={{ color: muted }}
              >
                {hasPassword ? "New password" : "Add password"}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={labelClass}
                style={{ color: muted }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="Re-enter password"
              />
            </div>

            {/* Footer */}
            <div
              className="-mx-6 flex items-center justify-end border-t px-6 pt-4"
              style={{ borderColor: border }}
            >
              <button
                type="submit"
                disabled={isPasswordMutationPending || isPasswordModeLoading}
                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {isPasswordMutationPending
                  ? hasPassword
                    ? "Changing…"
                    : "Adding…"
                  : hasPassword
                    ? "Change password"
                    : "Add password"}
              </button>
            </div>
          </form>
        </article>

        {/* ── Appearance card ── */}
        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          <div
            className="border-b px-6 py-4"
            style={{ borderColor: border, backgroundColor: mutedBg }}
          >
            <h2 className="text-sm font-semibold" style={{ color: deep }}>
              Appearance
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: muted }}>
              Choose your theme preference.
            </p>
          </div>

          <div className="px-6 py-5">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: muted }}
            >
              Theme
            </p>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: isActive ? accent : border,
                      color: isActive ? "#ffffff" : deep,
                      backgroundColor: isActive ? accent : mutedBg,
                    }}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        {/* ── Danger zone card ── */}
        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "#fecaca", backgroundColor: cardBg }}
        >
          <div
            className="flex items-center gap-2.5 border-b px-6 py-4"
            style={{ borderColor: "#fecaca", backgroundColor: "#fff5f5" }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle size={14} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-600">
                Danger zone
              </h2>
              <p className="text-xs text-red-400">
                Sign out from your current session.
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "#fecaca", color: "#dc2626" }}
            >
              <LogOut size={14} />
              {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

export default SettingsPanel;
