import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  KeyRound,
  MessageCircle,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import {
  useCancelRentRequest,
  useTenantRentalContracts,
} from "../../features/message/hooks/useMessageHooks";
import type {
  ContractStatus,
  ConversationListing,
  RentRequest,
  RentRequestParty,
} from "../../features/message/types/type";
import { palette } from "../../theme/palette";

type RentalsTab = "requested" | "rented";

const getListing = (
  listing: RentRequest["listingId"],
): ConversationListing | null => {
  return typeof listing === "string" ? null : listing;
};

const getParty = (party: RentRequest["ownerId"]): RentRequestParty | null => {
  return typeof party === "string" ? null : party;
};

const getStatusMeta = (status: ContractStatus) => {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Rented",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "RESERVED":
      return {
        label: "Awaiting Payment",
        className: "bg-amber-100 text-amber-700",
      };
    case "PENDING":
      return {
        label: "Request Sent",
        className: "bg-sky-100 text-sky-700",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-100 text-zinc-700",
      };
  }
};

const formatPrice = (listing: ConversationListing | null) => {
  if (listing?.price == null) {
    return "Price not available";
  }

  const currency = listing.currency || "ETB";
  return `${new Intl.NumberFormat().format(listing.price)} ${currency}/mo`;
};

const getListingStateMeta = (listing: ConversationListing | null) => {
  if (!listing?.status || listing.status === "Active") {
    return null;
  }

  if (listing.status === "Reserved") {
    return {
      label: "Room Reserved",
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (listing.status === "Rented") {
    return {
      label: "Room Rented",
      className: "bg-rose-100 text-rose-700",
    };
  }

  return {
    label: listing.status,
    className: "bg-zinc-100 text-zinc-700",
  };
};

const formatRemainingTime = (paymentDueAt?: string | null) => {
  if (!paymentDueAt) return null;

  const remainingMs = new Date(paymentDueAt).getTime() - Date.now();
  if (Number.isNaN(remainingMs)) return null;

  if (remainingMs <= 0) return "Expired";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

function MyRentalsPage() {
  const [activeTab, setActiveTab] = useState<RentalsTab>("requested");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const rentalsQuery = useTenantRentalContracts();
  const cancelRentRequest = useCancelRentRequest();

  const contracts = rentalsQuery.data ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const requestContracts = useMemo(
    () =>
      contracts
        .filter((contract) => {
          if (contract.status === "PENDING") return true;

          if (contract.status !== "RESERVED") return false;

          if (!contract.paymentDueAt) return true;

          return new Date(contract.paymentDueAt).getTime() > nowTick;
        })
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "RESERVED" ? -1 : 1;
          }

          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }),
    [contracts, nowTick],
  );

  const rentedContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "ACTIVE"),
    [contracts],
  );

  useEffect(() => {
    if (
      !rentalsQuery.isLoading &&
      activeTab === "requested" &&
      requestContracts.length === 0 &&
      rentedContracts.length > 0
    ) {
      setActiveTab("rented");
    }
  }, [
    activeTab,
    rentalsQuery.isLoading,
    requestContracts.length,
    rentedContracts.length,
  ]);

  const visibleContracts =
    activeTab === "requested" ? requestContracts : rentedContracts;

  const handleCancelRequest = async (contractId: string) => {
    try {
      await cancelRentRequest.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Rental request deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel request";
      toast.error(message);
    }
  };

  return (
    <main
      className="min-h-screen pt-17"
      style={{ backgroundColor: palette.pageBg }}
    >
      <LandingNavbar />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: palette.deep }}>
              My Rentals
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.softPurple }}>
              Track your rental requests, payment status, and active rentals in
              one place.
            </p>
          </div>

          <div className="grid min-w-[16rem] grid-cols-2 gap-3">
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: palette.softPurple }}
              >
                Requested
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: palette.deep }}
              >
                {rentalsQuery.isLoading ? "..." : requestContracts.length}
              </p>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: palette.softPurple }}
              >
                Rented
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: palette.deep }}
              >
                {rentalsQuery.isLoading ? "..." : rentedContracts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("requested")}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor:
                activeTab === "requested" ? palette.purple : palette.cardBg,
              color: activeTab === "requested" ? palette.pageBg : palette.deep,
              border: `1px solid ${palette.border}`,
            }}
          >
            Requested ({requestContracts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rented")}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor:
                activeTab === "rented" ? palette.purple : palette.cardBg,
              color: activeTab === "rented" ? palette.pageBg : palette.deep,
              border: `1px solid ${palette.border}`,
            }}
          >
            Rented ({rentedContracts.length})
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {rentalsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`rental-skeleton-${index}`}
                className="skeleton h-44 rounded-3xl"
              />
            ))
          ) : visibleContracts.length === 0 ? (
            <div
              className="rounded-3xl border p-8 text-sm"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
                color: palette.softPurple,
              }}
            >
              {activeTab === "requested"
                ? "You do not have any active rental requests right now."
                : "You do not have any active rentals yet."}
            </div>
          ) : (
            visibleContracts.map((contract) => {
              const listing = getListing(contract.listingId);
              const owner = getParty(contract.ownerId);
              const statusMeta = getStatusMeta(contract.status);
              const listingStateMeta = getListingStateMeta(listing);

              return (
                <article
                  key={contract._id}
                  className="rounded-3xl border p-6"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.cardBg,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: palette.cardMutedAltBg }}
                        >
                          <Building2
                            size={20}
                            style={{ color: palette.deep }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2
                              className="truncate text-xl font-semibold"
                              style={{ color: palette.deep }}
                            >
                              {listing?.title || "Rental Listing"}
                            </h2>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                            {listingStateMeta ? (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${listingStateMeta.className}`}
                              >
                                {listingStateMeta.label}
                              </span>
                            ) : null}
                          </div>

                          <p
                            className="mt-1 text-sm"
                            style={{ color: palette.softPurple }}
                          >
                            {[listing?.city, listing?.address]
                              .filter(Boolean)
                              .join(", ") || "Location not available"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: palette.border,
                            backgroundColor: palette.cardMutedAltBg,
                          }}
                        >
                          <p
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: palette.softPurple }}
                          >
                            Property Details
                          </p>
                          <p
                            className="mt-2 text-base font-semibold"
                            style={{ color: palette.deep }}
                          >
                            {formatPrice(listing)}
                          </p>
                          <p
                            className="mt-1 text-sm"
                            style={{ color: palette.softPurple }}
                          >
                            {activeTab === "requested" &&
                            contract.status === "RESERVED"
                              ? "Payment is pending. The request will disappear automatically if payment is not completed in time."
                              : activeTab === "requested"
                                ? "Your request is recorded and waiting for owner response."
                                : "Your rental is active and tracked here."}
                          </p>

                          {contract.status === "RESERVED" ? (
                            <div
                              className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: palette.chipBg,
                                color: palette.deep,
                              }}
                            >
                              <CalendarClock size={14} />
                              {formatRemainingTime(contract.paymentDueAt) ||
                                "Payment due soon"}
                            </div>
                          ) : null}
                        </div>

                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: palette.border,
                            backgroundColor: palette.cardMutedAltBg,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                              style={{ backgroundColor: palette.chipBg }}
                            >
                              {owner?.image ? (
                                <img
                                  src={owner.image}
                                  alt={owner.name || owner.email || "Owner"}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <UserRound
                                  size={18}
                                  style={{ color: palette.deep }}
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="text-xs font-semibold uppercase tracking-wide"
                                style={{ color: palette.softPurple }}
                              >
                                Owner Info
                              </p>
                              <p
                                className="truncate text-base font-semibold"
                                style={{ color: palette.deep }}
                              >
                                {owner?.name ||
                                  owner?.email ||
                                  "Property Owner"}
                              </p>
                              <p
                                className="truncate text-sm"
                                style={{ color: palette.softPurple }}
                              >
                                {owner?.email || "Contact available in chat"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {activeTab === "requested" ? (
                        <button
                          type="button"
                          onClick={() => void handleCancelRequest(contract._id)}
                          disabled={cancelRentRequest.isPending}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: "#E11D48" }}
                        >
                          <Trash2 size={16} />
                          {contract.status === "RESERVED"
                            ? "Cancel Request"
                            : "Delete Request"}
                        </button>
                      ) : null}

                      {listing?._id ? (
                        <Link
                          to={`/properties/${listing._id}`}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                          style={{
                            backgroundColor: palette.cardMutedAltBg,
                            color: palette.deep,
                          }}
                        >
                          <KeyRound size={16} />
                          View Property
                        </Link>
                      ) : null}

                      <Link
                        to={`/message?conversationId=${contract.conversationId}`}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{
                          backgroundColor: palette.purple,
                          color: palette.pageBg,
                        }}
                      >
                        <MessageCircle size={16} />
                        Open Chat
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

export default MyRentalsPage;
