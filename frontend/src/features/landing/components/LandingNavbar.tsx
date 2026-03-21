import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useIsDark from "../../../lib/useTheme";
import { Link, NavLink } from "react-router-dom";
import Logo from "../../../components/logo";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import { palette } from "../../../theme/palette";

const navItems = [
  { to: "/properties", label: "Find Place", icon: Search },
  { to: "/properties/saved", label: "Saved Property", icon: Heart },
  { to: "/find-roommate", label: "Find Roommate", icon: Users },
  { to: "/message", label: "Message", icon: MessageCircle },
  { to: "/dashboard", label: "My Listings", icon: LayoutDashboard },
];

function LandingNavbar() {
  const {
    user,
    isAuthenticated,
    isPending: isSessionPending,
  } = useCurrentUser();
  const { data: profile } = useMyProfile(isAuthenticated);
  const logoutMutation = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = useIsDark();

  const profileName = profile?.fullName?.trim() || "My Profile";
  const profilePictureUrl = profile?.profilePictureUrl || null;
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

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b bg-white/95 px-4 backdrop-blur "
      style={{ backgroundColor: palette.skeleton }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 py-1">
        <Link to="/" aria-label="Go to home" className="cursor-pointer">
          <Logo className="flex-row gap-2" />
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/properties"}
                className="group relative inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors"
                style={({ isActive }) => ({
                  color: isActive ? palette.purple : palette.deep,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={13} style={{ color: palette.softPurple }} />
                    {item.label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-current transition-transform duration-300 ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}

          {isAuthenticated ? (
            <div ref={profileMenuRef} className="relative ml-3">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-lg px-3 cursor-pointer py-2 text-md font-semibold"
                style={{ color: palette.purple }}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
              >
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={profileName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: palette.softPurple,
                      color: "#FFFFFF",
                    }}
                  >
                    {profileName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-36 truncate">
                  {isSessionPending ? "Loading..." : profileName}
                </span>
                <ChevronDown size={16} />
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
                      style={{ color: palette.deep }}
                    >
                      {profileName}
                    </p>
                    <p
                      className="mt-2 truncate text-md"
                      style={{ color: "#64748B" }}
                    >
                      {profileEmail}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    role="menuitem"
                    className={`flex w-full items-center gap-3 px-2 py-2 cursor-pointer text-left text-md ${
                      isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    }`}
                    style={{ color: palette.deep }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>

                  <Link
                    to="/setting"
                    role="menuitem"
                    className={`flex w-full items-center gap-3  px-2 py-2 cursor-pointer  text-left text-md ${
                      isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    }`}
                    style={{ color: palette.deep, borderColor: "#E4E4E7" }}
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
          ) : (
            <Link
              to="/login"
              className="ml-3 inline-flex items-center gap-2 rounded-lg cursor-pointer border px-4 py-2 text-md font-semibold"
              style={{
                borderColor: palette.lightPurple,
                color: palette.purple,
              }}
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default LandingNavbar;
