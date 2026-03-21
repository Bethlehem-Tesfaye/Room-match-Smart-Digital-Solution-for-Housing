import {
  Building2,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useIsDark from "../../../lib/useTheme";
import Logo from "../../../components/logo";
import { palette } from "../../../theme/palette";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import type { DashboardTabItem, DashboardTabKey } from "../types/types";

const dashboardTabs: DashboardTabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "my-properties", label: "My Properties", icon: Building2 },
  { key: "messages", label: "Messages", icon: MessageCircle },
  //   { key: "add-listing", label: "Add Listing", icon: PlusSquare },
];

interface DashboardNavbarProps {
  activeTab: DashboardTabKey;
  onTabChange?: (tab: DashboardTabKey) => void;
}

function DashboardNavbar({ activeTab, onTabChange }: DashboardNavbarProps) {
  const navigate = useNavigate();
  const { user, isPending: isSessionPending } = useCurrentUser();
  const { data: profile } = useMyProfile(true);
  const logoutMutation = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const isDark = useIsDark();

  const profileName = profile?.fullName?.trim() || "My Profile";
  const profileEmail = user?.email || "";

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleTabChange = (tab: DashboardTabKey) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }

    if (tab === "dashboard") {
      navigate("/dashboard");
      return;
    }

    if (tab === "my-properties") {
      navigate("/dashboard/my-properties");
      return;
    }

    if (tab === "add-listing") {
      navigate("/properties/create");
    }
  };

  return (
    <header
      className="border-b px-4"
      style={{
        borderColor: palette.border,
        backgroundColor: palette.sectionBg,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 py-4">
        <Link to="/" aria-label="Go to home" className="cursor-pointer">
          <Logo className="flex-row gap-2 mr-3" />
        </Link>
        <div className="flex items-center ">
          <nav className="flex flex-wrap items-center gap-2">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className="group relative inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-md font-semibold transition-colors"
                  style={{ color: isActive ? palette.purple : palette.deep }}
                >
                  <Icon size={16} style={{ color: palette.softPurple }} />
                  {tab.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-current transition-transform duration-300 ${
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              );
            })}

            <Link
              to="/properties"
              className="group relative inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-md font-semibold transition-colors"
              style={{ color: palette.deep }}
            >
              <Compass size={16} style={{ color: palette.softPurple }} />
              Discover Properties
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          </nav>
        </div>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((previous) => !previous)}
            className="inline-flex items-center  rounded-full px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: palette.chipBg, color: palette.deep }}
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
          >
            <ShieldCheck size={16} style={{ color: palette.purple }} />
            Owner Dashboard
            <ChevronDown size={16} style={{ color: palette.purple }} />
          </button>

          {isDropdownOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900"
              style={{ backgroundColor: palette.pageBg }}
            >
              <div
                className="border-b px-4 py-4"
                style={{ borderColor: "#E4E4E7" }}
              >
                <p
                  className="truncate text-md leading-none"
                  style={{ color: palette.lightPurple }}
                >
                  {profileName}
                </p>
                <p
                  className="mt-2 truncate text-md"
                  style={{ color: "#64748B" }}
                >
                  {isSessionPending ? "Loading..." : profileEmail}
                </p>
              </div>

              <Link
                to="/profile"
                role="menuitem"
                className={`flex w-full items-center gap-3 px-2 py-2 cursor-pointer text-left text-md hover:bg-gray-50 ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                }`}
                style={{ color: "#64748B" }}
                onClick={() => setIsDropdownOpen(false)}
              >
                <User size={16} />
                Profile
              </Link>

              <Link
                to="/setting"
                role="menuitem"
                className={`flex w-full items-center gap-3 px-2 py-2 cursor-pointer text-left text-md ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                }`}
                style={{ color: "#64748B", borderColor: "#E4E4E7" }}
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings size={16} />
                Settings
              </Link>

              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-3 border-t px-3 py-3 cursor-pointer text-left text-md hover:bg-red-200"
                style={{ color: "#E11D48", borderColor: "#E4E4E7" }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  logoutMutation.mutate();
                }}
                disabled={logoutMutation.isPending}
              >
                <LogOut size={16} />
                {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default DashboardNavbar;
