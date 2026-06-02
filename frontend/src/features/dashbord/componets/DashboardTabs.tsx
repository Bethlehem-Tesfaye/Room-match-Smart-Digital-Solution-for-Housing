import { useMemo } from "react";
import {
  Building2,
  Eye,
  MessageCircle,
  Plus,
  UsersRound,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useConversations,
  useOwnerPendingRentRequests,
} from "../../message/hooks/useMessageHooks";
import { useMyProfile } from "../../profile/hooks/useProfileHooks";
import {
  useMyListingCounts,
  useMyPropertiesOverview,
} from "../hooks/useDashboardHooks";
import type { DashboardTabKey } from "../types/types";

interface DashboardTabsProps {
  activeTab: DashboardTabKey;
}

type NonNullDashboardTabKey = Exclude<DashboardTabKey, null>;

const tabLabels: Record<NonNullDashboardTabKey, string> = {
  dashboard: "Dashboard",
  "my-properties": "My Properties",
  messages: "Messages",
  "rental-requests": "Rental Requests",
  "add-listing": "Add Listing",
};

function DashboardTabs({ activeTab }: DashboardTabsProps) {
  const { data: profile } = useMyProfile(true);
  const { data: counts, isPending: isCountsPending } = useMyListingCounts();
  const { data: myProperties, isPending: isPropertiesPending } =
    useMyPropertiesOverview({ page: 1, limit: 4 });
  const { data: conversations, isPending: isConversationsPending } =
    useConversations();
  const { data: pendingRentRequests, isPending: isRentRequestsPending } =
    useOwnerPendingRentRequests();

  const activeLabel = useMemo(
    () => tabLabels[activeTab as NonNullDashboardTabKey] ?? "Dashboard",
    [activeTab],
  );

  // ── Style tokens ────────────────────────────────────────────────────────
  const deep = "var(--palette-deep)";
  const muted = "var(--palette-soft-purple)";
  const border = "var(--palette-border)";
  const cardBg = "var(--palette-card-bg)";
  const mutedBg = "var(--palette-card-muted-alt-bg)";
  const chipBg = "var(--palette-chip-bg)";
  const accent = "#8b64c8";

  if (activeTab !== "dashboard") {
    return (
      <section className="space-y-6">
        <div
          className="min-h-80 overflow-hidden rounded-2xl border"
          style={{ borderColor: border, backgroundColor: cardBg }}
        >
          {/* Bento header strip */}
          <div
            className="flex items-center border-b px-5 py-3"
            style={{ borderColor: border, backgroundColor: mutedBg }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: muted }}
            >
              Dashboard · {activeLabel}
            </p>
          </div>
          <div className="px-5 py-6">
            <p className="text-sm" style={{ color: muted }}>
              Content for this section loads here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const firstName = profile?.fullName?.trim()?.split(" ")[0] || "Owner";
  const totalProperties = counts?.totalListings ?? 0;
  const activeListings = counts?.activeListings ?? 0;
  const messagesCount = conversations?.length ?? 0;
  const inquiriesCount = pendingRentRequests?.length ?? 0;
  const properties = myProperties?.properties ?? [];

  const statCards = [
    {
      label: "Total properties",
      value: isCountsPending ? null : totalProperties,
      icon: Building2,
      bg: chipBg,
    },
    {
      label: "Active listings",
      value: isCountsPending ? null : activeListings,
      icon: Eye,
      bg: "var(--palette-card-muted-bg)",
    },
    {
      label: "Messages",
      value: isConversationsPending ? null : messagesCount,
      icon: MessageCircle,
      bg: mutedBg,
    },
    {
      label: "Pending inquiries",
      value: isRentRequestsPending ? null : inquiriesCount,
      icon: UsersRound,
      bg: "var(--palette-section-bg)",
    },
  ];

  return (
    <section className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="mb-1 font-mono text-[10px] uppercase tracking-widest"
            style={{ color: muted }}
          >
            Owner · Dashboard
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: deep }}>
            Welcome back, {firstName}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: muted }}>
            Manage your properties and connect with tenants
          </p>
        </div>

        <Link
          to="/properties/create"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          <Plus size={14} />
          Add property
        </Link>
      </div>

      {/* ── Stat cards — bento grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: border, backgroundColor: cardBg }}
            >
              {/* Header strip */}
              <div
                className="flex items-center justify-between border-b px-4 py-2.5"
                style={{ borderColor: border, backgroundColor: card.bg }}
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: muted }}
                >
                  {card.label}
                </p>
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: chipBg }}
                >
                  <Icon size={12} style={{ color: accent }} />
                </div>
              </div>

              {/* Value */}
              <div className="px-4 py-4">
                {card.value === null ? (
                  <div className="skeleton h-8 w-12 rounded-lg" />
                ) : (
                  <p className="text-3xl font-bold" style={{ color: deep }}>
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Properties list card ── */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        {/* Bento header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: border, backgroundColor: mutedBg }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: muted }}
          >
            Your properties
          </p>
          <Link
            to="/dashboard/my-properties"
            className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: accent }}
          >
            View all
            <ArrowRight size={11} />
          </Link>
        </div>

        <div className="divide-y" style={{ borderColor: border }}>
          {isPropertiesPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton h-16 w-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-56 rounded" />
                  <div className="flex gap-2">
                    <div className="skeleton h-5 w-20 rounded" />
                    <div className="skeleton h-5 w-14 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : properties.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: muted }}>
                No properties yet.
              </p>
            </div>
          ) : (
            properties.slice(0, 4).map((property) => {
              const primaryImage =
                property.images.find((img) => img.isPrimary)?.imageUrl ||
                property.images[0]?.imageUrl ||
                "";

              const statusColors: Record<
                string,
                { bg: string; color: string }
              > = {
                Active: { bg: "#e6f9f0", color: "#166534" },
                Rented: { bg: "#f0ebff", color: "#8b64c8" },
                Reserved: { bg: "#fef9ec", color: "#92400e" },
              };
              const sc = statusColors[property.status] ?? {
                bg: chipBg,
                color: deep,
              };

              return (
                <div
                  key={property._id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  {/* Thumbnail */}
                  <div
                    className="h-16 w-24 shrink-0 overflow-hidden rounded-xl"
                    style={{ backgroundColor: "var(--palette-card-muted-bg)" }}
                  >
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 size={16} style={{ color: muted }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: deep }}
                    >
                      {property.title}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: muted }}
                    >
                      {property.city}, {property.address}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: accent }}
                      >
                        {new Intl.NumberFormat().format(property.price)}/mo
                      </span>
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {property.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default DashboardTabs;
