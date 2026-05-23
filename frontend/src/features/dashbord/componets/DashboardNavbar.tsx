import {
  Building2,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  User,
  X,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../../components/logo";
import useIsDark from "../../../lib/useTheme";
import { palette } from "../../../theme/palette";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useLogout } from "../../auth/hooks/useLogout";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import {
  useMessageSocket,
  useUnreadMessageCounts,
} from "../../message/hooks/useMessageHooks";
import type { DashboardTabItem, DashboardTabKey } from "../types/types";

const dashboardTabs: DashboardTabItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "my-properties", label: "My Properties", icon: Building2 },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "rental-requests", label: "Rental Requests", icon: ClipboardCheck },
  //   { key: "add-listing", label: "Add Listing", icon: PlusSquare },
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
  const logoutMutation = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const isDark = useIsDark();
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
        byType: {
          ...byType,
          Message: (byType.Message ?? 0) + 1,
        },
      };
    });
  };

  useMessageSocket({
    enabled: !!user,
    onReceiveNotification: (notification) => {
      if (notification.type === "Message") {
        bumpUnreadMessageCount();
      }

      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-counts"],
      });
    },
  });

  const profileName = profile?.fullName?.trim() || "My Profile";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      className="border-b px-4 fixed left-0 right-0 top-0 z-500 mb-20"
      style={{
        borderColor: palette.border,
        backgroundColor: palette.sectionBg,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 py-4 lg:gap-6">
        <Link to="/" aria-label="Go to home" className="cursor-pointer">
          <Logo className="mr-3 flex-row gap-2" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden flex-wrap items-center gap-2 lg:flex">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const showUnreadBadge =
                tab.key === "messages" &&
                totalUnread > 0 &&
                !isConversationOpen;

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
                  {showUnreadBadge ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--palette-purple) px-1 text-[10px] font-bold text-white">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  ) : null}
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

            {/* <Link
              to="/roommate"
              className="group relative inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-md font-semibold transition-colors"
              style={{ color: palette.deep }}
            >
              <Users size={16} style={{ color: palette.softPurple }} />
              Find Roommate
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
            </Link> */}
          </nav>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={toggleProfileMenu}
              className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold sm:px-4"
              style={{ backgroundColor: palette.chipBg, color: palette.deep }}
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
            >
              <ShieldCheck size={16} style={{ color: palette.purple }} />
              <span className="hidden sm:inline">Owner Dashboard</span>
              <ChevronDown size={16} style={{ color: palette.purple }} />
            </button>

            {isDropdownOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900"
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
                  to="/dashboard/profile"
                  role="menuitem"
                  className={`flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left text-md ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                  style={{ color: "#64748B" }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>

                <Link
                  to="/dashboard/setting"
                  role="menuitem"
                  className={`flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left text-md ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                  style={{ color: "#64748B", borderColor: "#E4E4E7" }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>

                <Link
                  to="/"
                  role="menuitem"
                  className={`flex w-full cursor-pointer items-center gap-3 border-t px-2 py-2 text-left text-md ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                  style={{ color: "#64748B", borderColor: "#E4E4E7" }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Home size={16} />
                  Switch to Tenant View
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
                  ? "Close dashboard menu"
                  : "Open dashboard menu"
              }
              aria-controls="dashboard-mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isMobileMenuOpen ? (
              <div
                id="dashboard-mobile-navigation"
                className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border shadow-lg z-100"
                style={{
                  backgroundColor: palette.sectionBg,
                  borderColor: palette.border,
                }}
              >
                <nav className="flex flex-col p-2">
                  {dashboardTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    const showUnreadBadge =
                      tab.key === "messages" &&
                      totalUnread > 0 &&
                      !isConversationOpen;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleTabChange(tab.key);
                        }}
                        className={`flex ${tab.key === "messages" ? "relative" : ""} cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-semibold transition-colors ${
                          isActive
                            ? isDark
                              ? "bg-gray-700 text-purple-300"
                              : "bg-purple-100 text-purple-700"
                            : isDark
                              ? "text-zinc-100 hover:bg-gray-600"
                              : "text-zinc-900 hover:bg-purple-100"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{tab.label}</span>
                        {showUnreadBadge ? (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--palette-purple) px-1 text-[10px] font-bold text-white">
                            {totalUnread > 99 ? "99+" : totalUnread}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}

                  <Link
                    to="/roommate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${isDark ? "text-white hover:bg-gray-600" : "text-zinc-900 hover:bg-purple-100"}`}
                  >
                    <Users
                      size={18}
                      className={isDark ? "text-white" : "text-black"}
                    />
                    <span>Find Roommate</span>
                  </Link>
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardNavbar;
