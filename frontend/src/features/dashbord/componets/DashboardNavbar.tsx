import {
  Building2,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  User,
  Sun,
  X,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../../components/logo";
import useIsDark from "../../../lib/useTheme";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import {
  useMessageSocket,
  useUnreadMessageCounts,
} from "../../message/hooks/useMessageHooks";
import { useRentalUnreadCounts } from "../context/RentalUnreadCountsContext";
import { setOwnerRentalUnreadCounts } from "../hooks/useRentalUnreadHooks";
import type { DashboardTabItem, DashboardTabKey } from "../types/types";
import { useThemePreference } from "../../setting/hooks/useSettingHooks";

const dashboardTabs: DashboardTabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "my-properties", label: "My Properties", icon: Building2 },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "rental-requests", label: "Rental Management", icon: ClipboardCheck },
];

interface DashboardNavbarProps {
  activeTab: DashboardTabKey;
  onTabChange?: (tab: DashboardTabKey) => void;
}

function DashboardNavbar({ activeTab, onTabChange }: DashboardNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isPending: isSessionPending } = useCurrentUser();
  const { data: profile } = useMyProfile(true);
  const unreadCountsQuery = useUnreadMessageCounts(true);
  const { totalUnreadCount: rentalTotalUnread } = useRentalUnreadCounts();
  const logoutMutation = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = useIsDark();
  const { theme, setTheme } = useThemePreference();

  const totalUnread = unreadCountsQuery.data?.total ?? 0;
  const isConversationOpen =
    (location.pathname === "/dashboard/message" ||
      location.pathname === "/message") &&
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
    enabled: !!user,
    onReceiveNotification: (notification) => {
      if (notification.type === "Message") bumpUnreadMessageCount();
      if (notification.type === "ListingUpdate") {
        void queryClient.invalidateQueries({
          queryKey: ["contracts", "owner", "unread-counts"],
        });
      }
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-counts"],
      });
    },
    onRentalUnreadUpdate: (counts) => {
      setOwnerRentalUnreadCounts(queryClient, counts);
    },
  });

  const profileName = profile?.fullName?.trim() || "My Profile";
  const profileEmail = user?.email || "";

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
    if (tab === "messages") {
      navigate("/dashboard/message");
      return;
    }
    if (tab === "rental-requests") {
      navigate("/dashboard/rental-requests");
      return;
    }
    if (tab === "add-listing") {
      navigate("/properties/create");
    }
  };

  const toggleProfileMenu = () =>
    setIsDropdownOpen((prev) => {
      if (!prev) setIsMobileMenuOpen(false);
      return !prev;
    });
  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((prev) => {
      if (!prev) setIsDropdownOpen(false);
      return !prev;
    });

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // ── Style tokens ────────────────────────────────────────────────────────
  // const navBg = isDark ? "#17112e" : "#ffffff";
  // const navBorder = isDark ? "#3a2d5c" : "#e5d9f9";
  // const deepColor = isDark ? "#ede9f8" : "#2e1f4a";
  const mutedColor = isDark ? "#9b78d4" : "#a98fd4";
  // const chipBg = isDark ? "#251c42" : "#ede7fd";
  const dropBg = isDark ? "#17112e" : "#ffffff";
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "#f5f1ff";
  const accent = "#8b64c8";

  const navBg = "var(--palette-section-bg)";
  const navBorder = "var(--palette-border)";
  const deepColor = "var(--app-text)";
  const chipBg = "var(--palette-chip-bg)";
  // const dropdownBg = "var(--palette-card-bg)";
  // const dropdownBorder = "var(--palette-border)";
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
        {/* Logo */}
        <Link to="/" aria-label="Go to home" className="shrink-0">
          <Logo className="flex-row gap-2" />
        </Link>

        {/* Desktop tabs — centered */}
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {dashboardTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const showMessageBadge =
              tab.key === "messages" && totalUnread > 0 && !isConversationOpen;
            const showRentalBadge =
              tab.key === "rental-requests" && rentalTotalUnread > 0;
            const badgeCount =
              tab.key === "messages"
                ? totalUnread
                : tab.key === "rental-requests"
                  ? rentalTotalUnread
                  : 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className="relative inline-flex items-center px-3 py-1.5 text-sm transition-colors duration-150"
                style={{
                  color: isActive ? accent : deepColor,
                  fontWeight: isActive ? 600 : 450,
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                <span>{tab.label}</span>

                {/* Active dot underline */}
                <span
                  className="absolute -bottom-px left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: accent,
                    width: isActive ? "16px" : "0px",
                  }}
                />

                {/* Unread badge */}
                {(showMessageBadge || showRentalBadge) && (
                  <span
                    className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-full border transition-colors lg:inline-flex"
            style={{
              borderColor: navBorder,
              color: mutedColor,
              backgroundColor: "transparent",
            }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Owner dashboard pill */}
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={toggleProfileMenu}
              className="inline-flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-3 text-xs font-medium transition-colors"
              style={{
                borderColor: navBorder,
                color: deepColor,
                backgroundColor: isDropdownOpen ? chipBg : "transparent",
              }}
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
            >
              <ShieldCheck size={13} style={{ color: accent }} />
              <span className="hidden sm:inline">Owner dashboard</span>
              <ChevronDown
                size={12}
                style={{
                  color: mutedColor,
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            </button>

            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 overflow-hidden rounded-xl shadow-lg"
                style={{
                  width: "264px",
                  backgroundColor: dropBg,
                  border: `1px solid ${navBorder}`,
                  boxShadow: "0 8px 24px rgba(46,31,74,0.1)",
                }}
              >
                {/* User info */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: `1px solid ${navBorder}` }}
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
                    {isSessionPending ? "Loading…" : profileEmail}
                  </p>
                </div>

                {/* Links */}
                <div className="p-1.5">
                  {[
                    { to: "/dashboard/profile", icon: User, label: "Profile" },
                    {
                      to: "/dashboard/setting",
                      icon: Settings,
                      label: "Settings",
                    },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
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

                  <Link
                    to="/"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{ color: deepColor }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        hoverBg)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Home size={14} style={{ color: mutedColor }} />
                    Switch to tenant view
                  </Link>
                </div>

                <div
                  className="p-1.5"
                  style={{ borderTop: `1px solid ${navBorder}` }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{ color: deepColor }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        hoverBg)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleThemeToggle();
                    }}
                  >
                    <span style={{ color: mutedColor }}>
                      {isDark ? "Light mode" : "Dark mode"}
                    </span>
                  </button>
                </div>

                {/* Sign out */}
                <div
                  className="p-1.5"
                  style={{ borderTop: `1px solid ${navBorder}` }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{ color: "#dc2626" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(220,38,38,0.06)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
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

          {/* Mobile hamburger */}
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
              aria-controls="dashboard-mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {isMobileMenuOpen && (
              <div
                id="dashboard-mobile-navigation"
                className="absolute right-0 top-full mt-2 overflow-hidden rounded-xl"
                style={{
                  width: "min(20rem, calc(100vw - 2rem))",
                  backgroundColor: dropBg,
                  border: `1px solid ${navBorder}`,
                  boxShadow: "0 8px 24px rgba(46,31,74,0.1)",
                }}
              >
                <nav className="flex flex-col p-1.5">
                  {dashboardTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    const showMessageBadge =
                      tab.key === "messages" &&
                      totalUnread > 0 &&
                      !isConversationOpen;
                    const showRentalBadge =
                      tab.key === "rental-requests" && rentalTotalUnread > 0;
                    const badgeCount =
                      tab.key === "messages"
                        ? totalUnread
                        : tab.key === "rental-requests"
                          ? rentalTotalUnread
                          : 0;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleTabChange(tab.key);
                        }}
                        className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left"
                        style={{
                          color: isActive ? accent : deepColor,
                          backgroundColor: isActive ? chipBg : "transparent",
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLElement
                          ).style.backgroundColor = isActive
                            ? chipBg
                            : "transparent";
                        }}
                      >
                        <Icon
                          size={15}
                          style={{ color: isActive ? accent : mutedColor }}
                        />
                        <span>{tab.label}</span>
                        {(showMessageBadge || showRentalBadge) && (
                          <span
                            className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{ backgroundColor: accent }}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <Link
                    to="/roommate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
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
                    <Users size={15} style={{ color: mutedColor }} />
                    <span>Find roommate</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      handleThemeToggle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
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
                    <span style={{ color: mutedColor }}>
                      {isDark ? "Switch to light mode" : "Switch to dark mode"}
                    </span>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardNavbar;
