import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarClock,
  KeyRound,
  MessageCircle,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../lib/axios";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import {
  useCancelRentRequest,
  useCreateTerminationNotice,
  useCompleteEarlyTermination,
  useWithdrawTerminationNotice,
  useTenantRentalContracts,
} from "../../features/message/hooks/useMessageHooks";
import { useTenantRentalUnreadCountsContext } from "../../features/rentals/context/TenantRentalUnreadCountsContext";
import type {
  ContractStatus,
  ConversationListing,
  RentRequest,
  RentRequestParty,
} from "../../features/message/types/type";

type RentalsTab = "requested" | "rented" | "termination" | "history";

function TabUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
      style={{ backgroundColor: "#8b64c8" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const pendingPaymentStorageKey = "pending_rental_payment_contract_id";

const getListing = (
  listing: RentRequest["listingId"],
): ConversationListing | null => (typeof listing === "string" ? null : listing);

const getParty = (party: RentRequest["ownerId"]): RentRequestParty | null =>
  typeof party === "string" ? null : party;

const getTerminationRequester = (
  requester: RentRequest["terminationRequestedBy"],
): RentRequestParty | null =>
  typeof requester === "string" ? null : (requester ?? null);

// ── Status badge config — uses palette vars like the rest of the app ─────────
const getStatusMeta = (status: ContractStatus) => {
  switch (status) {
    case "ACTIVE":
      return { label: "Rented", bg: "#e6f9f0", color: "#166534" };
    case "RESERVED":
      return { label: "Awaiting payment", bg: "#fef9ec", color: "#92400e" };
    case "REJECTED":
      return { label: "Rejected", bg: "#fff1f2", color: "#be123c" };
    case "CANCELLED":
      return { label: "Cancelled", bg: "#f5f1ff", color: "#6b5fa8" };
    case "PENDING":
      return { label: "Request sent", bg: "#f0ebff", color: "#8b64c8" };
    case "TERMINATION_PENDING":
      return { label: "Notice active", bg: "#fff8e7", color: "#92400e" };
    case "TERMINATED":
      return { label: "Terminated", bg: "#f5f1ff", color: "#6b5fa8" };
    default:
      return { label: status, bg: "#f5f1ff", color: "#6b5fa8" };
  }
};

const formatPrice = (listing: ConversationListing | null) => {
  if (listing?.price == null) return "Price not available";
  const currency = listing.currency || "ETB";
  return `${new Intl.NumberFormat().format(listing.price)} ${currency}/mo`;
};

const getListingStateMeta = (listing: ConversationListing | null) => {
  if (!listing?.status || listing.status === "Active") return null;
  if (listing.status === "Reserved")
    return { label: "Room reserved", bg: "#fef9ec", color: "#92400e" };
  if (listing.status === "Rented")
    return { label: "Room rented", bg: "#fff1f2", color: "#be123c" };
  return { label: listing.status, bg: "#f5f1ff", color: "#6b5fa8" };
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

const formatNoticeCountdown = (effectiveDate?: string | null) => {
  if (!effectiveDate) return null;
  const remainingMs = new Date(effectiveDate).getTime() - Date.now();
  if (Number.isNaN(remainingMs)) return null;
  if (remainingMs <= 0) return "Terminates today";
  const totalDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  if (totalDays === 30) return "30 days remaining";
  if (totalDays === 1) return "1 day remaining";
  return `${totalDays} days remaining`;
};

const formatNoticeDate = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const e = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return e.response?.data?.message || e.message || "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
};

// ── Shared ghost action button ────────────────────────────────────────────────
function ActionBtn({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
}) {
  const styles: Record<string, { bg: string; color: string; border: string }> =
    {
      primary: { bg: "#8b64c8", color: "#ffffff", border: "transparent" },
      danger: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      ghost: { bg: "#f0ebff", color: "#2e1f4a", border: "#e5d9f9" },
    };
  const s = styles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </button>
  );
}

function MyRentalsPage() {
  const [activeTab, setActiveTab] = useState<RentalsTab>("rented");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingPaymentContractId, setPendingPaymentContractId] = useState<
    string | null
  >(null);
  const paymentReturnHandledRef = useRef(false);
  const requestedMarkStartedRef = useRef(false);
  const terminationMarkStartedRef = useRef(false);
  const { user } = useCurrentUser();
  const {
    requestedUnreadCount,
    terminationUnreadCount,
    markRequestedAsRead,
    markTerminationAsRead,
  } = useTenantRentalUnreadCountsContext();
  const rentalsQuery = useTenantRentalContracts();
  const cancelRentRequest = useCancelRentRequest();
  const createTerminationNotice = useCreateTerminationNotice();
  const completeEarlyTermination = useCompleteEarlyTermination();
  const withdrawTerminationNotice = useWithdrawTerminationNotice();

  useEffect(() => {
    if (activeTab !== "requested") {
      requestedMarkStartedRef.current = false;
      return;
    }
    if (requestedMarkStartedRef.current) return;
    requestedMarkStartedRef.current = true;
    void markRequestedAsRead().catch(() => {
      requestedMarkStartedRef.current = false;
    });
  }, [activeTab, markRequestedAsRead]);

  useEffect(() => {
    if (activeTab !== "termination") {
      terminationMarkStartedRef.current = false;
      return;
    }
    if (terminationMarkStartedRef.current) return;
    terminationMarkStartedRef.current = true;
    void markTerminationAsRead().catch(() => {
      terminationMarkStartedRef.current = false;
    });
  }, [activeTab, markTerminationAsRead]);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") {
      paymentReturnHandledRef.current = false;
      return;
    }
    if (paymentReturnHandledRef.current) return;
    paymentReturnHandledRef.current = true;
    const contractId = window.localStorage.getItem(pendingPaymentStorageKey);
    const finalizePayment = async () => {
      if (!contractId) {
        toast.success("Payment completed successfully.");
        await rentalsQuery.refetch();
        setSearchParams({}, { replace: true });
        return;
      }
      try {
        await api.post("/api/payments/confirm", { contractId });
        toast.success("Payment completed successfully.");
        await rentalsQuery.refetch();
      } catch (error) {
        toast.error(getErrorMessage(error) || "Payment confirmation failed");
      } finally {
        window.localStorage.removeItem(pendingPaymentStorageKey);
        setSearchParams({}, { replace: true });
      }
    };
    void finalizePayment();
  }, [rentalsQuery, searchParams, setSearchParams]);

  const contracts = rentalsQuery.data ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const requestContracts = useMemo(
    () =>
      contracts
        .filter((c) => {
          if (c.status === "PENDING") return true;
          if (c.status !== "RESERVED") return false;
          if (!c.paymentDueAt) return true;
          return new Date(c.paymentDueAt).getTime() > nowTick;
        })
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "RESERVED" ? -1 : 1;
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }),
    [contracts, nowTick],
  );

  const rentedContracts = useMemo(
    () =>
      contracts.filter((c) =>
        ["ACTIVE", "TERMINATION_PENDING"].includes(c.status),
      ),
    [contracts],
  );

  const terminationContracts = useMemo(
    () => contracts.filter((c) => c.status === "TERMINATION_PENDING"),
    [contracts],
  );

  const historyContracts = useMemo(
    () =>
      contracts.filter((c) =>
        ["REJECTED", "CANCELLED", "TERMINATED"].includes(c.status),
      ),
    [contracts],
  );

  const visibleContracts =
    activeTab === "requested"
      ? requestContracts
      : activeTab === "rented"
        ? rentedContracts
        : activeTab === "termination"
          ? terminationContracts
          : historyContracts;

  const handleCancelRequest = async (contractId: string) => {
    try {
      await cancelRentRequest.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Rental request deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel request",
      );
    }
  };

  const handleCompletePayment = async (contractId: string) => {
    setPendingPaymentContractId(contractId);
    try {
      const response = await api.post<{ checkout_url: string }>(
        "/api/payments/initialize",
        { contractId },
      );
      const checkoutUrl = response.data.checkout_url;
      if (!checkoutUrl) throw new Error("Missing checkout URL");
      window.localStorage.setItem(pendingPaymentStorageKey, contractId);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to start payment");
      window.localStorage.removeItem(pendingPaymentStorageKey);
    } finally {
      setPendingPaymentContractId(null);
    }
  };

  const handleSendTerminationRequest = async (contractId: string) => {
    try {
      await createTerminationNotice.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Termination notice created");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create termination notice",
      );
    }
  };

  const handleWithdrawTermination = async (contractId: string) => {
    try {
      await withdrawTerminationNotice.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Termination notice withdrawn");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to withdraw termination notice",
      );
    }
  };

  const handleCompleteEarlyTermination = async (contractId: string) => {
    try {
      await completeEarlyTermination.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Rental ended early");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to complete early termination",
      );
    }
  };

  const isTerminationRequester = (contract: RentRequest) => {
    const requester = contract.terminationRequestedBy;
    const requesterId =
      typeof requester === "string" ? requester : requester?._id;
    return requesterId === user?.id;
  };

  // ── Style tokens ──────────────────────────────────────────────────────────
  const deep = "var(--palette-deep)";
  const muted = "var(--palette-soft-purple)";
  const cardBg = "var(--palette-card-bg)";
  const mutedAltBg = "var(--palette-card-muted-alt-bg)";
  const border = "var(--palette-border)";
  const chipBg = "var(--palette-chip-bg)";
  const pageBg = "var(--palette-page-bg)";

  const tabs: {
    id: RentalsTab;
    label: string;
    count: number;
    badge?: number;
  }[] = [
    { id: "rented", label: "Rented", count: rentedContracts.length },
    {
      id: "requested",
      label: "Requested",
      count: requestContracts.length,
      badge: requestedUnreadCount,
    },
    {
      id: "termination",
      label: "Termination",
      count: terminationContracts.length,
      badge: terminationUnreadCount,
    },
    { id: "history", label: "History", count: historyContracts.length },
  ];

  return (
    <main className="min-h-screen pb-12" style={{ backgroundColor: pageBg }}>
      <LandingNavbar />

      <section className="mx-auto max-w-7xl px-4 pt-24">
        {/* ── Page header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              className="mb-1 text-xs uppercase tracking-widest"
              style={{ color: muted }}
            >
              Tenant · Rentals
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: deep }}>
              My Rentals
            </h1>
            <p className="mt-1 text-sm" style={{ color: muted }}>
              Track requests, payments, and active rentals.
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex gap-3">
            {[
              { label: "Active", value: rentedContracts.length },
              { label: "Pending", value: requestContracts.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border px-5 py-3 text-center"
                style={{ borderColor: border, backgroundColor: cardBg }}
              >
                <p className="text-xs font-medium" style={{ color: muted }}>
                  {stat.label}
                </p>
                <p
                  className="mt-1 text-2xl font-semibold"
                  style={{ color: deep }}
                >
                  {rentalsQuery.isLoading ? "—" : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "#8b64c8" : cardBg,
                  color: isActive ? "#ffffff" : deep,
                  border: `1px solid ${isActive ? "#8b64c8" : border}`,
                }}
              >
                {tab.label}
                <span
                  className="ml-1.5 text-xs"
                  style={{ opacity: isActive ? 0.8 : 0.5 }}
                >
                  {tab.count}
                </span>
                {tab.badge ? <TabUnreadBadge count={tab.badge} /> : null}
              </button>
            );
          })}
        </div>

        {/* ── Contract list ── */}
        <div className="space-y-4">
          {rentalsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))
          ) : visibleContracts.length === 0 ? (
            <div
              className="rounded-2xl border px-6 py-10 text-center text-sm"
              style={{
                borderColor: border,
                backgroundColor: cardBg,
                color: muted,
              }}
            >
              {activeTab === "requested"
                ? "No active rental requests."
                : activeTab === "rented"
                  ? "No active rentals yet."
                  : activeTab === "termination"
                    ? "No termination requests."
                    : "No rental history yet."}
            </div>
          ) : (
            visibleContracts.map((contract) => {
              const listing = getListing(contract.listingId);
              const owner = getParty(contract.ownerId);
              const statusMeta = getStatusMeta(contract.status);
              const listingStateMeta = getListingStateMeta(listing);
              const isNoticeActive = contract.status === "TERMINATION_PENDING";
              const noticeInitiator = getTerminationRequester(
                contract.terminationRequestedBy,
              );
              const noticeCountdown = formatNoticeCountdown(
                contract.terminationEffectiveDate,
              );
              const canCompletePayment =
                contract.status === "RESERVED" &&
                contract.paymentDueAt &&
                new Date(contract.paymentDueAt).getTime() > nowTick;
              const isCompletingThisPayment =
                pendingPaymentContractId === contract._id;

              return (
                <article
                  key={contract._id}
                  className="rounded-2xl border"
                  style={{ borderColor: border, backgroundColor: cardBg }}
                >
                  {/* Card header */}
                  <div
                    className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
                    style={{ borderColor: border }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: chipBg }}
                      >
                        <Building2 size={16} style={{ color: "#8b64c8" }} />
                      </div>
                      <div className="min-w-0">
                        <h2
                          className="truncate text-sm font-semibold"
                          style={{ color: deep }}
                        >
                          {listing?.title || "Rental listing"}
                        </h2>
                        <p className="mt-0.5 text-xs" style={{ color: muted }}>
                          {[listing?.city, listing?.address]
                            .filter(Boolean)
                            .join(", ") || "Location not available"}
                        </p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      {listingStateMeta && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: listingStateMeta.bg,
                            color: listingStateMeta.color,
                          }}
                        >
                          {listingStateMeta.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {/* Property details */}
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: border,
                        backgroundColor: mutedAltBg,
                      }}
                    >
                      <p
                        className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: muted }}
                      >
                        Property details
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{ color: deep }}
                      >
                        {formatPrice(listing)}
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: muted }}
                      >
                        {activeTab === "requested"
                          ? contract.status === "RESERVED"
                            ? "Payment pending — request expires if not completed in time."
                            : "Waiting for owner response."
                          : activeTab === "rented"
                            ? isNoticeActive
                              ? "This rental is in its 30-day notice period."
                              : "Your rental is active."
                            : activeTab === "termination"
                              ? "Waiting for the notice period to end or be withdrawn."
                              : contract.status === "REJECTED"
                                ? "Rejected by the owner."
                                : contract.status === "CANCELLED"
                                  ? "Cancelled — stored in your history."
                                  : "Terminated — stored in your history."}
                      </p>

                      {/* Payment countdown chip */}
                      {contract.status === "RESERVED" && (
                        <div
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ backgroundColor: chipBg, color: deep }}
                        >
                          <CalendarClock size={12} />
                          {formatRemainingTime(contract.paymentDueAt) ||
                            "Payment due soon"}
                        </div>
                      )}

                      {/* Termination notice box */}
                      {isNoticeActive && (
                        <div
                          className="mt-4 rounded-xl border p-4"
                          style={{
                            borderColor: "#f5d487",
                            backgroundColor: "#fff8e7",
                          }}
                        >
                          <p
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "#92400e" }}
                          >
                            Termination notice active
                          </p>
                          <div
                            className="mt-2 space-y-1 text-xs"
                            style={{ color: "#78350f" }}
                          >
                            <p>
                              Requested by:{" "}
                              <span className="font-medium">
                                {noticeInitiator?.name ||
                                  noticeInitiator?.email ||
                                  (isTerminationRequester(contract)
                                    ? "you"
                                    : "the other party")}
                              </span>
                            </p>
                            <p>
                              Notice submitted:{" "}
                              <span className="font-medium">
                                {formatNoticeDate(
                                  contract.terminationRequestedAt,
                                )}
                              </span>
                            </p>
                            <p>
                              Rental ends:{" "}
                              <span className="font-medium">
                                {formatNoticeDate(
                                  contract.terminationEffectiveDate,
                                )}
                              </span>
                            </p>
                          </div>
                          <p
                            className="mt-2 text-xs font-semibold"
                            style={{ color: "#8b64c8" }}
                          >
                            {noticeCountdown || "Notice period active"}
                          </p>
                          <p
                            className="mt-1 text-xs leading-relaxed"
                            style={{ color: "#92400e", opacity: 0.8 }}
                          >
                            Auto-terminates on{" "}
                            {formatNoticeDate(
                              contract.terminationEffectiveDate,
                            )}{" "}
                            unless withdrawn before that date.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Owner info */}
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: border,
                        backgroundColor: mutedAltBg,
                      }}
                    >
                      <p
                        className="mb-3 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: muted }}
                      >
                        Owner
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: chipBg }}
                        >
                          {owner?.image ? (
                            <img
                              src={owner.image}
                              alt={owner.name || owner.email || "Owner"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserRound size={16} style={{ color: "#8b64c8" }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: deep }}
                          >
                            {owner?.name || owner?.email || "Property owner"}
                          </p>
                          <p
                            className="mt-0.5 truncate text-xs"
                            style={{ color: muted }}
                          >
                            {owner?.email || "Contact available in chat"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card footer — actions */}
                  <div
                    className="flex flex-wrap items-center gap-2 border-t px-5 py-3"
                    style={{ borderColor: border }}
                  >
                    {/* Complete payment */}
                    {activeTab === "requested" && canCompletePayment && (
                      <ActionBtn
                        variant="primary"
                        onClick={() => void handleCompletePayment(contract._id)}
                        disabled={isCompletingThisPayment}
                      >
                        {isCompletingThisPayment
                          ? "Redirecting…"
                          : "Complete payment"}
                      </ActionBtn>
                    )}

                    {/* Cancel / delete request */}
                    {activeTab === "requested" && (
                      <ActionBtn
                        variant="danger"
                        onClick={() => void handleCancelRequest(contract._id)}
                        disabled={cancelRentRequest.isPending}
                      >
                        <Trash2 size={14} />
                        {contract.status === "RESERVED"
                          ? "Cancel request"
                          : "Delete request"}
                      </ActionBtn>
                    )}

                    {/* Rented tab actions */}
                    {activeTab === "rented" &&
                      (contract.status === "TERMINATION_PENDING" ? (
                        isTerminationRequester(contract) ? (
                          <ActionBtn
                            variant="ghost"
                            onClick={() =>
                              void handleWithdrawTermination(contract._id)
                            }
                            disabled={withdrawTerminationNotice.isPending}
                          >
                            Withdraw notice
                          </ActionBtn>
                        ) : (
                          <ActionBtn
                            variant="primary"
                            onClick={() =>
                              void handleCompleteEarlyTermination(contract._id)
                            }
                            disabled={completeEarlyTermination.isPending}
                          >
                            Early termination
                          </ActionBtn>
                        )
                      ) : (
                        <ActionBtn
                          variant="ghost"
                          onClick={() =>
                            void handleSendTerminationRequest(contract._id)
                          }
                          disabled={createTerminationNotice.isPending}
                        >
                          Create termination notice
                        </ActionBtn>
                      ))}

                    {/* Termination tab actions */}
                    {activeTab === "termination" &&
                      (isTerminationRequester(contract) ? (
                        <ActionBtn
                          variant="ghost"
                          onClick={() =>
                            void handleWithdrawTermination(contract._id)
                          }
                          disabled={withdrawTerminationNotice.isPending}
                        >
                          Withdraw notice
                        </ActionBtn>
                      ) : (
                        <ActionBtn
                          variant="primary"
                          onClick={() =>
                            void handleCompleteEarlyTermination(contract._id)
                          }
                          disabled={completeEarlyTermination.isPending}
                        >
                          Early termination
                        </ActionBtn>
                      ))}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* View property */}
                    {listing?._id && (
                      <Link
                        to={`/properties/${listing._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-75"
                        style={{
                          borderColor: border,
                          color: deep,
                          backgroundColor: mutedAltBg,
                        }}
                      >
                        <KeyRound size={14} />
                        View property
                      </Link>
                    )}

                    {/* Open chat */}
                    <Link
                      to={`/message?conversationId=${contract.conversationId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#8b64c8" }}
                    >
                      <MessageCircle size={14} />
                      Open chat
                    </Link>
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
