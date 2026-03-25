import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "../../../components/logo";
import useIsDark from "../../../lib/useTheme";
import { palette } from "../../../theme/palette";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";

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
  const location = useLocation();
  const { data: profile } = useMyProfile(isAuthenticated);
  const logoutMutation = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = useIsDark();

  const profileName = profile?.fullName?.trim() || "My Profile";
  const profilePictureUrl = profile?.profilePictureUrl || null;
  const profileEmail = user?.email || "";

  useEffect(() => {
    if (!isDropdownOpen && !isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleProfileMenu = () => {
    setIsDropdownOpen((previous) => {
      const next = !previous;

      if (next) {
        setIsMobileMenuOpen(false);
      }

      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => {
      const next = !previous;

      if (next) {
        setIsDropdownOpen(false);
      }

      return next;
    });
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-500 border-b  bg-white/95 px-4 backdrop-blur ${isMobileMenuOpen ? " border-b " : ""}`}
      style={{
        backgroundColor: palette.skeleton,
        // borderColor: palette.border,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2 lg:gap-6">
        <Link to="/" aria-label="Go to home" className="cursor-pointer">
          <Logo className="flex-row gap-2" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden items-center gap-2 lg:flex">
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
          </nav>

          {isAuthenticated ? (
            <div ref={profileMenuRef} className="relative ml-3">
              <button
                type="button"
                onClick={toggleProfileMenu}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 text-md font-semibold sm:rounded-lg sm:px-3"
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
                <span className="hidden max-w-36 truncate xl:inline">
                  {isSessionPending ? "Loading..." : profileName}
                </span>
                <ChevronDown size={16} />
              </button>

              {isDropdownOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-100 w-80 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900"
                  style={{
                    backgroundColor: palette.pageBg,
                    borderColor: palette.border,
                  }}
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
                    className={`flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left text-md ${
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
                    className={`flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left text-md ${
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
                    className="flex w-full cursor-pointer items-center gap-3 border-t px-3 py-3 text-left text-md hover:bg-red-200"
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
              className="ml-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-md font-semibold sm:px-4"
              style={{
                borderColor: palette.lightPurple,
                color: palette.purple,
              }}
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: isMobileMenuOpen
                  ? palette.lightPurple
                  : "transparent",
                color: palette.deep,
              }}
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-controls="landing-mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isMobileMenuOpen && (
              <div
                id="landing-mobile-navigation"
                className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden border shadow-lg"
                style={{
                  backgroundColor: palette.skeleton,
                  borderColor: palette.border,
                }}
              >
                <nav className="flex flex-col p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/properties"}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${
                            isActive
                              ? isDark
                                ? "bg-gray-700 text-purple-300"
                                : "bg-gray-100 text-purple-700"
                              : isDark
                                ? "text-zinc-100 hover:bg-gray-600"
                                : "text-zinc-900 hover:bg-gray-100"
                          }`
                        }
                        style={{
                          color: palette.purple,
                        }}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
