import {
  ChevronDown,
  Heart,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "../../../components/logo";
import useIsDark from "../../../lib/useTheme";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import {
  useMessageSocket,
  useUnreadMessageCounts,
} from "../../message/hooks/useMessageHooks";
import { useTenantRentalUnreadCountsContext } from "../../rentals/context/TenantRentalUnreadCountsContext";
import { setTenantRentalUnreadCounts } from "../../rentals/hooks/useTenantRentalUnreadHooks";
import { useThemePreference } from "../../setting/hooks/useSettingHooks";

const baseNavItems = [
  { to: "/properties", label: "Find Place", icon: Search },
  { to: "/properties/saved", label: "Saved", icon: Heart },
  { to: "/roommate", label: "Find Roommate", icon: Users },
  { to: "/message", label: "Messages", icon: MessageCircle },
];

function LandingNavbar() {
  const {
    user,
    isAuthenticated,
    isPending: isSessionPending,
  } = useCurrentUser();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile(isAuthenticated);
  const unreadCountsQuery = useUnreadMessageCounts(isAuthenticated);
  const tenantRentalUnread = useTenantRentalUnreadCountsContext();
  const logoutMutation = useLogout();
  const { theme, setTheme } = useThemePreference();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = useIsDark();

  const navItems = useMemo(() => {
    if (!isAuthenticated) {
      return [baseNavItems[0]];
    }

    const tenantNavItem =
      profile?.role !== "admin"
        ? [{ to: "/my-rentals", label: "My Rentals", icon: KeyRound }]
        : [];
    return [
      ...baseNavItems.slice(0, 4),
      ...tenantNavItem,
      ...baseNavItems.slice(4),
    ];
  }, [isAuthenticated, profile?.role]);

  const profileName = profile?.fullName?.trim() || "My Profile";
  const profilePictureUrl = profile?.profilePictureUrl || null;
  const profileEmail = user?.email || "";
  const showOwnerDashboardSwitch = isAuthenticated && profile?.role !== "admin";
  const totalUnread = unreadCountsQuery.data?.total ?? 0;
  const tenantRentalTotalUnread = tenantRentalUnread.totalUnreadCount;
  const isConversationOpen =
    (location.pathname === "/message" ||
      location.pathname === "/dashboard/message") &&
    new URLSearchParams(location.search).has("conversationId");

  const bumpUnreadMessageCount = () => {
    queryClient.setQueryData<{
      total?: number;
      byConversation?: Record<string, number>;
      byType?: Record<string, number>;
    }>(["notifications", "unread-counts"], (previous) => {
      const byType = previous?.byType ?? {};
      return {
        total: (previous?.total ?? 0) + 1,
        byConversation: previous?.byConversation ?? {},
        byType: { ...byType, Message: (byType.Message ?? 0) + 1 },
      };
    });
  };

  useMessageSocket({
    enabled: isAuthenticated,
    onReceiveNotification: (notification) => {
      if (notification.type === "Message") bumpUnreadMessageCount();
      if (notification.type === "ListingUpdate") {
        void queryClient.invalidateQueries({
          queryKey: ["contracts", "tenant", "unread-counts"],
        });
      }
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-counts"],
      });
    },
    onTenantRentalUnreadUpdate: (counts) => {
      setTenantRentalUnreadCounts(queryClient, counts);
    },
  });

  useEffect(() => {
    if (!isDropdownOpen && !isMobileMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target))
        setIsDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target))
        setIsMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isMobileMenuOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleProfileMenu = () => {
    setIsDropdownOpen((prev) => {
      if (!prev) setIsMobileMenuOpen(false);
      return !prev;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      if (!prev) setIsDropdownOpen(false);
      return !prev;
    });
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const navBg = "var(--palette-section-bg)";
  const navBorder = "var(--palette-border)";
  const deepColor = "var(--app-text)";
  const chipBg = "var(--palette-chip-bg)";
  const dropdownBg = "var(--palette-card-bg)";
  const dropdownBorder = "var(--palette-border)";
  const mutedColor = isDark ? "#9b78d4" : "#a98fd4";

  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "#f5f1ff";
  const iconBtnStyle = {
    borderColor: navBorder,
    color: mutedColor,
    backgroundColor: "transparent",
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      style={{
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBorder}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 lg:px-6">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link to="/" aria-label="Go to home" className="shrink-0">
          <Logo className="flex-row gap-2" />
        </Link>

        {/* ── Desktop nav — centered ────────────────────────────────────── */}
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const showMessageBadge =
              item.to === "/message" && totalUnread > 0 && !isConversationOpen;
            const showRentalsBadge =
              item.to === "/my-rentals" && tenantRentalTotalUnread > 0;
            const badgeCount =
              item.to === "/message"
                ? totalUnread
                : item.to === "/my-rentals"
                  ? tenantRentalTotalUnread
                  : 0;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/properties"}
                className="relative inline-flex items-center px-3 py-1.5 text-sm transition-colors duration-150"
                style={({ isActive }) => ({
                  color: isActive ? "#8b64c8" : deepColor,
                  fontWeight: isActive ? 600 : 450,
                  opacity: isActive ? 1 : 0.75,
                })}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>

                    {/* Active pill underline */}
                    <span
                      className="absolute -bottom-px left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: "#8b64c8",
                        width: isActive ? "16px" : "0px",
                      }}
                    />

                    {/* Unread badge */}
                    {(showMessageBadge || showRentalsBadge) && (
                      <span
                        className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ backgroundColor: "#8b64c8" }}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Right side actions ────────────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Theme toggle — desktop */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-full border transition-colors lg:inline-flex"
            style={iconBtnStyle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* ── Authenticated ── */}
          {isAuthenticated ? (
            <div ref={profileMenuRef} className="relative">
              {/* Profile pill */}
              <button
                type="button"
                onClick={toggleProfileMenu}
                className="inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors duration-150"
                style={{
                  borderColor: navBorder,
                  backgroundColor: isDropdownOpen ? chipBg : "transparent",
                }}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
              >
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={profileName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "#8b64c8" }}
                  >
                    {profileName.charAt(0).toUpperCase()}
                  </span>
                )}

                <span
                  className="hidden max-w-28 truncate text-sm xl:block"
                  style={{ color: deepColor, fontWeight: 500 }}
                >
                  {isSessionPending ? "…" : profileName}
                </span>

                <ChevronDown
                  size={13}
                  style={{
                    color: mutedColor,
                    transform: isDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 overflow-hidden rounded-xl shadow-lg"
                  style={{
                    width: "272px",
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorder}`,
                    boxShadow: "0 8px 24px rgba(46,31,74,0.1)",
                  }}
                >
                  {/* User info */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: `1px solid ${dropdownBorder}` }}
                  >
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: deepColor }}
                    >
                      {profileName}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: mutedColor }}
                    >
                      {profileEmail}
                    </p>
                  </div>

                  {/* Nav links */}
                  <div className="p-1.5">
                    {[
                      { to: "/profile", icon: User, label: "Profile" },
                      { to: "/setting", icon: Settings, label: "Settings" },
                      {
                        to: "/support",
                        icon: LifeBuoy,
                        label: "Ask support",
                      },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                        style={{ color: deepColor }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = hoverBg)
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = "transparent")
                        }
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Icon size={14} style={{ color: mutedColor }} />
                        {label}
                      </Link>
                    ))}

                    {showOwnerDashboardSwitch && (
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                        style={{ color: deepColor }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = hoverBg)
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = "transparent")
                        }
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard
                          size={14}
                          style={{ color: mutedColor }}
                        />
                        Owner dashboard
                      </Link>
                    )}
                  </div>

                  {/* Sign out */}
                  <div
                    className="p-1.5"
                    style={{ borderTop: `1px solid ${dropdownBorder}` }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                      style={{ color: "#dc2626" }}
                      onMouseEnter={(e) =>
                        ((
                          e.currentTarget as HTMLElement
                        ).style.backgroundColor = "rgba(220,38,38,0.06)")
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLElement
                        ).style.backgroundColor = "transparent")
                      }
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logoutMutation.mutate();
                      }}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut size={14} />
                      {logoutMutation.isPending ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Login button ── */
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderColor: "#c8b4ec",
                color: "#8b64c8",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "#ede7fd")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "transparent")
              }
            >
              <LogIn size={14} />
              Login
            </Link>
          )}

          {/* ── Mobile hamburger ── */}
          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
              style={{
                borderColor: navBorder,
                color: deepColor,
                backgroundColor: isMobileMenuOpen ? chipBg : "transparent",
              }}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-controls="landing-mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {isMobileMenuOpen && (
              <div
                id="landing-mobile-navigation"
                className="absolute right-0 top-full mt-2 overflow-hidden rounded-xl"
                style={{
                  width: "min(20rem, calc(100vw - 2rem))",
                  backgroundColor: dropdownBg,
                  border: `1px solid ${dropdownBorder}`,
                  boxShadow: "0 8px 24px rgba(46,31,74,0.1)",
                }}
              >
                {/* Nav links */}
                <nav className="flex flex-col p-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const showMessageBadge =
                      item.to === "/message" &&
                      totalUnread > 0 &&
                      !isConversationOpen;
                    const showRentalsBadge =
                      item.to === "/my-rentals" && tenantRentalTotalUnread > 0;
                    const badgeCount =
                      item.to === "/message"
                        ? totalUnread
                        : item.to === "/my-rentals"
                          ? tenantRentalTotalUnread
                          : 0;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/properties"}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                        style={({ isActive }) => ({
                          color: isActive ? "#8b64c8" : deepColor,
                          backgroundColor: isActive ? chipBg : "transparent",
                          fontWeight: isActive ? 600 : 400,
                        })}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.backgroundColor = hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          // keep chipBg if active — react-router sets style via style prop
                          // so just clear; the style prop will re-apply on next render
                          el.style.backgroundColor = "";
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={15}
                              style={{
                                color: isActive ? "#8b64c8" : mutedColor,
                              }}
                            />
                            <span>{item.label}</span>
                            {(showMessageBadge || showRentalsBadge) && (
                              <span
                                className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                                style={{ backgroundColor: "#8b64c8" }}
                              >
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Mobile theme toggle row */}
                <div
                  className="p-1.5"
                  style={{ borderTop: `1px solid ${dropdownBorder}` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleThemeToggle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                    style={{ color: deepColor }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        hoverBg)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                  >
                    {isDark ? (
                      <Sun size={15} style={{ color: mutedColor }} />
                    ) : (
                      <Moon size={15} style={{ color: mutedColor }} />
                    )}
                    <span>
                      {isDark ? "Switch to light mode" : "Switch to dark mode"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
