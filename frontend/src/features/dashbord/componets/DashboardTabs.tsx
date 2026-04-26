import { useMemo } from "react";
import { Building2, Eye, MessageCircle, Plus, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";
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
  const {
    data: pendingRentRequests,
    isPending: isRentRequestsPending,
  } = useOwnerPendingRentRequests();

  const activeLabel = useMemo(
    () => tabLabels[activeTab as NonNullDashboardTabKey] ?? "Dashboard",
    [activeTab],
  );

  if (activeTab !== "dashboard") {
    return (
      <section className="space-y-6">
        <div
          className="min-h-80 rounded-2xl border p-6"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: palette.deep }}>
            {activeLabel}
          </h2>
          <p className="mt-2 text-sm" style={{ color: palette.softPurple }}>
            UI shell is ready. Content for this section can be added next.
          </p>
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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: palette.deep }}>
            Welcome back, {firstName}!
          </h2>
          <p className="mt-1 text-md" style={{ color: palette.softPurple }}>
            Manage your properties and connect with tenants
          </p>
        </div>

        <Link
          to="/properties/create"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: palette.purple, color: palette.pageBg }}
        >
          <Plus size={16} />
          Add Property
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Total Properties
              </p>
              <p
                className="mt-2 text-4xl font-bold"
                style={{ color: palette.deep }}
              >
                {isCountsPending ? "..." : totalProperties}
              </p>
            </div>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.chipBg }}
            >
              <Building2 size={18} style={{ color: palette.deep }} />
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Active Listings
              </p>
              <p
                className="mt-2 text-4xl font-bold"
                style={{ color: palette.deep }}
              >
                {isCountsPending ? "..." : activeListings}
              </p>
            </div>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.cardMutedBg }}
            >
              <Eye size={18} style={{ color: palette.deep }} />
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Messages
              </p>
              <p
                className="mt-2 text-4xl font-bold"
                style={{ color: palette.deep }}
              >
                {isConversationsPending ? "..." : messagesCount}
              </p>
            </div>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.cardMutedAltBg }}
            >
              <MessageCircle size={18} style={{ color: palette.deep }} />
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Inquiries
              </p>
              <p
                className="mt-2 text-4xl font-bold"
                style={{ color: palette.deep }}
              >
                {isRentRequestsPending ? "..." : inquiriesCount}
              </p>
            </div>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: palette.sectionBg }}
            >
              <UsersRound size={18} style={{ color: palette.deep }} />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div
          className="rounded-2xl border p-6 xl:col-span-2"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3
              className="text-2xl font-semibold"
              style={{ color: palette.deep }}
            >
              Your Properties
            </h3>
            <Link
              to="/dashboard/my-properties"
              className="cursor-pointer text-sm font-semibold"
              style={{ color: palette.purple }}
            >
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {isPropertiesPending ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`property-skeleton-${index}`}
                  className="flex items-center gap-4"
                >
                  <div className="skeleton h-20 w-28 rounded-xl" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="skeleton h-5 w-44 rounded-md" />
                    <div className="skeleton h-4 w-60 rounded-md" />
                    <div className="flex items-center gap-3">
                      <div className="skeleton h-6 w-24 rounded-md" />
                      <div className="skeleton h-5 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
              ))
            ) : properties.length === 0 ? (
              <p className="text-sm" style={{ color: palette.softPurple }}>
                No properties available yet.
              </p>
            ) : (
              properties.slice(0, 4).map((property) => {
                const primaryImage =
                  property.images.find((image) => image.isPrimary)?.imageUrl ||
                  property.images[0]?.imageUrl ||
                  "";

                return (
                  <div key={property._id} className="flex items-center gap-4">
                    <div
                      className="h-20 w-28 overflow-hidden rounded-xl"
                      style={{ backgroundColor: palette.cardMutedBg }}
                    >
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xl font-semibold"
                        style={{ color: palette.deep }}
                      >
                        {property.title}
                      </p>
                      <p
                        className="text-md"
                        style={{ color: palette.softPurple }}
                      >
                        {property.city}, {property.address}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span
                          className="text-xl font-bold"
                          style={{ color: palette.purple }}
                        >
                          {new Intl.NumberFormat().format(property.price)}/mo
                        </span>
                        <span
                          className="rounded-md px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor:
                              property.status === "Active"
                                ? palette.cardMutedBg
                                : palette.chipBg,
                            color: palette.deep,
                          }}
                        >
                          {property.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3
              className="text-2xl font-semibold"
              style={{ color: palette.deep }}
            >
              Recent Messages
            </h3>
            <button
              type="button"
              className="cursor-pointer text-sm font-semibold"
              style={{ color: palette.purple }}
            >
              View All →
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <p
                  className="text-xl font-semibold"
                  style={{ color: palette.deep }}
                >
                  Jessica Brown
                </p>
                <span className="text-sm" style={{ color: palette.softPurple }}>
                  Mar 19
                </span>
              </div>
              <p className="text-sm" style={{ color: palette.purple }}>
                Re: Sunny Room in Shared House
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Thanks! Can I schedule a visit this week?
              </p>
            </div>

            <div>
              <div className="flex items-start justify-between gap-3">
                <p
                  className="text-xl font-semibold"
                  style={{ color: palette.deep }}
                >
                  Sarah Johnson
                </p>
                <span className="text-sm" style={{ color: palette.softPurple }}>
                  Mar 17
                </span>
              </div>
              <p className="text-sm" style={{ color: palette.purple }}>
                Re: Modern Luxury Apartment in Downtown
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                I’m interested, is the unit still available?
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}

export default DashboardTabs;
