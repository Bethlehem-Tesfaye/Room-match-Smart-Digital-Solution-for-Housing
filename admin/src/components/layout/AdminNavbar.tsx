import { useState } from "react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  ShieldAlert,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminNotifications } from "../../context/AdminNotificationContext";
import { signOutAdmin } from "../../lib/api";
import { adminPalette } from "../../theme/palette";

const navItems = [
  { to: "/dashboard", label: "Users", icon: LayoutDashboard, match: "/dashboard" },
  {
    to: "/dashboard/properties",
    label: "Properties",
    icon: Building2,
    match: "/dashboard/properties",
  },
  {
    to: "/dashboard/reports",
    label: "Reports",
    icon: ClipboardList,
    match: "/dashboard/reports",
  },
  {
    to: "/dashboard/support",
    label: "Support",
    icon: LifeBuoy,
    match: "/dashboard/support",
  },
  {
    to: "/dashboard/scam-reports",
    label: "Scam reports",
    icon: ShieldAlert,
    match: "/dashboard/scam-reports",
  },
] as const;

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { counts } = useAdminNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (match: string) => {
    if (match === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(match);
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOutAdmin();
      navigate("/login", { replace: true });
      window.location.reload();
    } catch {
      setSigningOut(false);
    }
  };

  const badgeFor = (match: string) => {
    if (match === "/dashboard/properties") return counts.propertyNotifications;
    if (match === "/dashboard/reports") return counts.reportNotifications;
    if (match === "/dashboard/support") return counts.supportNotifications;
    if (match === "/dashboard/scam-reports") return counts.scamReportNotifications;
    return 0;
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        borderColor: adminPalette.border,
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:px-6">
        <Link to="/dashboard" className="inline-flex shrink-0 items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: adminPalette.deep }}
          >
            <Shield size={16} />
          </span>
          <span className="hidden text-sm font-bold sm:inline" style={{ color: adminPalette.deep }}>
            RoomMatch Admin
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.match);
            const badge = badgeFor(item.match);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
                style={{
                  color: active ? adminPalette.accent : adminPalette.deep,
                  fontWeight: active ? 600 : 450,
                  opacity: active ? 1 : 0.78,
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                <span
                  className="absolute -bottom-px left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: adminPalette.accent,
                    width: active ? "18px" : "0px",
                  }}
                />
                {badge > 0 && (
                  <span
                    className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: adminPalette.accent }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={signingOut}
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 lg:inline-flex"
            style={{ backgroundColor: adminPalette.accent }}
          >
            <LogOut size={14} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border lg:hidden"
            style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="border-t px-4 py-3 lg:hidden"
          style={{
            borderColor: adminPalette.border,
            backgroundColor: adminPalette.sectionBg,
          }}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.match);
              const badge = badgeFor(item.match);
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    color: active ? adminPalette.accent : adminPalette.deep,
                    backgroundColor: active ? adminPalette.chipBg : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  {badge > 0 && (
                    <span
                      className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: adminPalette.accent }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: adminPalette.accent }}
            >
              <LogOut size={14} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default AdminNavbar;
