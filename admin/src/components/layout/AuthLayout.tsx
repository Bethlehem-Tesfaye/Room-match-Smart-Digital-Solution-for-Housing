import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { adminPalette } from "../../theme/palette";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: adminPalette.pageBg }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span
            className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: adminPalette.deep }}
          >
            <Shield size={22} />
          </span>
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: adminPalette.muted }}
          >
            RoomMatch · Admin
          </p>
          <h1
            className="mt-2 text-2xl font-semibold tracking-tight"
            style={{ color: adminPalette.deep }}
          >
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: adminPalette.muted }}>
            {subtitle}
          </p>
        </div>

        <div
          className="rounded-2xl border p-7 shadow-sm"
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.cardBg,
          }}
        >
          {children}
        </div>

        <div className="mt-5 text-center text-sm" style={{ color: adminPalette.muted }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium" style={{ color: adminPalette.deep }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200"
        style={{
          borderColor: adminPalette.border,
          backgroundColor: adminPalette.inputBg,
          color: adminPalette.deep,
        }}
      />
    </div>
  );
}

export function AuthButton({
  children,
  disabled,
  type = "submit",
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: adminPalette.accent }}
    >
      {children}
    </button>
  );
}

export function AuthAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "success";
}) {
  const styles =
    variant === "success"
      ? { border: "#bbf7d0", bg: "#f0fdf4", color: "#166534" }
      : { border: "#fecaca", bg: "#fef2f2", color: adminPalette.accent };

  return (
    <div
      className="mb-4 rounded-xl border px-3 py-2.5 text-sm"
      style={{
        borderColor: styles.border,
        backgroundColor: styles.bg,
        color: styles.color,
      }}
    >
      {children}
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold" style={{ color: adminPalette.accent }}>
      {children}
    </Link>
  );
}

export default AuthLayout;
