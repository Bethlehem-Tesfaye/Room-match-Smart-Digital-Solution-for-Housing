import type { ReactNode } from "react";
import AdminNavbar from "./AdminNavbar";
import { adminPalette } from "../../theme/palette";

type AdminShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

function AdminShell({ eyebrow, title, subtitle, children }: AdminShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: adminPalette.pageBg }}
    >
      <AdminNavbar />
      <main className="flex-1 px-4 py-10 pt-20">
        <div className="mx-auto max-w-6xl space-y-5">
          <div>
            <p
              className="mb-1 font-mono text-[10px] uppercase tracking-widest"
              style={{ color: adminPalette.muted }}
            >
              {eyebrow}
            </p>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: adminPalette.deep }}
            >
              {title}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: adminPalette.muted }}>
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminShell;
