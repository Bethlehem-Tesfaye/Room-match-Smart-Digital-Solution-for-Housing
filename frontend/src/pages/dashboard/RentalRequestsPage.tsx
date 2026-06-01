import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  MessageSquare,
  Receipt,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import {
  useAcceptRentRequest,
  useCancelRentRequest,
  useCreateTerminationNotice,
  useOwnerActiveRentRequests,
  useOwnerAcceptedRentRequests,
  useOwnerPendingRentRequests,
  useOwnerTerminationRequests,
  useRejectRentRequest,
  useWithdrawTerminationNotice,
} from "../../features/message/hooks/useMessageHooks";
import type { RentRequest } from "../../features/message/types/type";
import { useRentalUnreadCounts } from "../../features/dashbord/context/RentalUnreadCountsContext";

type RequestsTab = "active" | "incoming" | "accepted" | "termination";

function TabUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const getPartyName = (party: RentRequest["tenantId"]) => {
  if (typeof party === "string") return party;
  return party.name || party.email || party._id;
};

const getListingTitle = (listing: RentRequest["listingId"]) => {
  if (typeof listing === "string") return "Listing";
  return listing.title || "Listing";
};

const getListing = (listing: RentRequest["listingId"]) => {
  return typeof listing === "string" ? null : listing;
};

const getListingId = (listing: RentRequest["listingId"]) => {
  if (typeof listing === "string") return listing;
  return listing._id;
};

const getNoticeInitiatorId = (request: RentRequest) => {
  const requester = request.terminationRequestedBy;
  if (!requester) return null;
  return typeof requester === "string" ? requester : requester._id;
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

// ── Termination notice panel ──────────────────────────────────────────────────
function TerminationPanel({
  request,
  isNoticeInitiator,
}: {
  request: RentRequest;
  isNoticeInitiator: boolean;
}) {
  const noticeInitiator =
    typeof request.terminationRequestedBy === "string"
      ? null
      : request.terminationRequestedBy;
  const noticeCountdown = formatNoticeCountdown(
    request.terminationEffectiveDate,
  );

  return (
    <div
      className="mt-4 rounded-2xl border p-4 space-y-1"
      style={{ borderColor: "#F5D487", backgroundColor: "#FFF8E7" }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: "#92400e" }}
      >
        Termination notice active
      </p>
      <p className="text-sm" style={{ color: "#78350f" }}>
        <span className="font-semibold">Requested by: </span>
        {noticeInitiator?.name ||
          noticeInitiator?.email ||
          (isNoticeInitiator ? "you" : "the other party")}
      </p>
      <p className="text-sm" style={{ color: "#78350f" }}>
        <span className="font-semibold">Notice submitted: </span>
        {formatNoticeDate(request.terminationRequestedAt)}
      </p>
      <p className="text-sm" style={{ color: "#78350f" }}>
        <span className="font-semibold">Rental ends: </span>
        {formatNoticeDate(request.terminationEffectiveDate)}
      </p>
      {noticeCountdown && (
        <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
          {noticeCountdown}
        </p>
      )}
      <p className="text-sm pt-1" style={{ color: "#a16207" }}>
        This rental will automatically terminate on{" "}
        {formatNoticeDate(request.terminationEffectiveDate)} unless the
        initiator withdraws the notice before that date.
      </p>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({
  status,
  isNoticeActive,
}: {
  status: string;
  isNoticeActive: boolean;
}) {
  if (isNoticeActive) {
    return (
      <span
        className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: "#fef9ec",
          borderColor: "#f5d487",
          color: "#92400e",
        }}
      >
        Termination pending
      </span>
    );
  }
  if (status === "ACTIVE") {
    return (
      <span
        className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: "#e6f9f0",
          borderColor: "#86efac",
          color: "#166534",
        }}
      >
        Active
      </span>
    );
  }
  if (status === "RESERVED") {
    return (
      <span
        className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: "#f0ebff",
          borderColor: "#c4b5fd",
          color: "#8b64c8",
        }}
      >
        Reserved
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span
        className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: "#fef9ec",
          borderColor: "#fcd34d",
          color: "#92400e",
        }}
      >
        Pending
      </span>
    );
  }
  return (
    <span
      className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: "#f5f1ff",
        borderColor: "var(--palette-border)",
        color: "#6b5fa8",
      }}
    >
      {status}
    </span>
  );
}

// ── Active rental card ────────────────────────────────────────────────────────
function ActiveRentalCard({
  request,
  user,
  onCreateTermination,
  onWithdrawTermination,
  isPending,
}: {
  request: RentRequest;
  user: { id: string } | null;
  onCreateTermination: (id: string) => void;
  onWithdrawTermination: (id: string) => void;
  isPending: boolean;
}) {
  const listingId = getListingId(request.listingId);
  const listingTitle = getListingTitle(request.listingId);
  const listing = getListing(request.listingId);
  const tenantName = getPartyName(request.tenantId);
  const isNoticeActive = request.status === "TERMINATION_PENDING";
  const noticeInitiatorId = getNoticeInitiatorId(request);
  const isNoticeInitiator = noticeInitiatorId === user?.id;

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--palette-border)",
        backgroundColor: "var(--palette-card-bg)",
        boxShadow: "0 1px 4px rgba(46,31,74,0.06)",
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{
          backgroundColor: "var(--palette-card-muted-alt-bg)",
          borderColor: "var(--palette-border)",
        }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          Active rental
        </span>
        <StatusBadge status={request.status} isNoticeActive={isNoticeActive} />
      </div>

      {/* Body */}
      <div className="p-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Left — property info */}
        <div className="space-y-4">
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Property
            </p>
            <Link
              to={`/properties/${listingId}`}
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--palette-deep)" }}
            >
              {listingTitle}
            </Link>
          </div>

          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Location
            </p>
            <p className="text-sm" style={{ color: "var(--palette-deep)" }}>
              {[listing?.city, listing?.address].filter(Boolean).join(", ") ||
                "Not available"}
            </p>
          </div>

          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Monthly rent
            </p>
            <p className="text-base font-bold" style={{ color: "#8b64c8" }}>
              {listing?.price != null
                ? `${new Intl.NumberFormat().format(listing.price)} ${listing.currency || "ETB"}/mo`
                : "Not available"}
            </p>
          </div>

          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Tenant
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--palette-deep)" }}
            >
              {tenantName}
            </p>
          </div>

          {isNoticeActive && (
            <TerminationPanel
              request={request}
              isNoticeInitiator={isNoticeInitiator}
            />
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div
        className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t"
        style={{ borderColor: "var(--palette-border)" }}
      >
        {isNoticeActive && isNoticeInitiator ? (
          <button
            type="button"
            onClick={() => onWithdrawTermination(request._id)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--palette-border)",
              color: "var(--palette-deep)",
              backgroundColor: "var(--palette-card-muted-alt-bg)",
            }}
          >
            <RotateCcw size={13} />
            Withdraw notice
          </button>
        ) : !isNoticeActive ? (
          <button
            type="button"
            onClick={() => onCreateTermination(request._id)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "#fecaca",
              color: "#dc2626",
              backgroundColor: "transparent",
            }}
          >
            <AlertTriangle size={13} />
            Create termination notice
          </button>
        ) : null}

        <Link
          to={`/dashboard/receipts/${request._id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium"
          style={{
            borderColor: "var(--palette-border)",
            color: "var(--palette-deep)",
            backgroundColor: "var(--palette-card-muted-alt-bg)",
          }}
        >
          <Receipt size={13} />
          View receipt
        </Link>

        <Link
          to={`/dashboard/message?conversationId=${request.conversationId}`}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#8b64c8" }}
        >
          <MessageSquare size={13} />
          Open chat
        </Link>
      </div>
    </article>
  );
}

// ── Request card (incoming / accepted / termination) ──────────────────────────
function RequestCard({
  request,
  activeTab,
  user,
  onAccept,
  onReject,
  onCancel,
  onWithdrawTermination,
  isMutating,
}: {
  request: RentRequest;
  activeTab: RequestsTab;
  user: { id: string } | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  onWithdrawTermination: (id: string) => void;
  isMutating: boolean;
  nowTick: number;
}) {
  const listingId = getListingId(request.listingId);
  const listingTitle = getListingTitle(request.listingId);
  const tenantName = getPartyName(request.tenantId);
  const isNoticeActive = request.status === "TERMINATION_PENDING";
  const noticeInitiatorId = getNoticeInitiatorId(request);
  const isNoticeInitiator = noticeInitiatorId === user?.id;

  const tabLabel =
    activeTab === "incoming"
      ? "Incoming request"
      : activeTab === "accepted"
        ? "Accepted · Awaiting payment"
        : "Termination notice";

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--palette-border)",
        backgroundColor: "var(--palette-card-bg)",
        boxShadow: "0 1px 4px rgba(46,31,74,0.06)",
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{
          backgroundColor: "var(--palette-card-muted-alt-bg)",
          borderColor: "var(--palette-border)",
        }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          {tabLabel}
        </span>
        <StatusBadge status={request.status} isNoticeActive={isNoticeActive} />
      </div>

      {/* Body */}
      <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Tenant
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--palette-deep)" }}
            >
              {tenantName}
            </p>
          </div>

          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Listing
            </p>
            <Link
              to={`/properties/${listingId}`}
              className="text-sm font-semibold hover:underline"
              style={{ color: "#8b64c8" }}
            >
              {listingTitle}
            </Link>
          </div>

          {request.status === "RESERVED" && request.paymentDueAt && (
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                Payment deadline
              </p>
              <div
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: "#fef9ec",
                  borderColor: "#fcd34d",
                  color: "#92400e",
                }}
              >
                <Clock size={10} />
                {formatRemainingTime(request.paymentDueAt)}
              </div>
            </div>
          )}

          {isNoticeActive && (
            <TerminationPanel
              request={request}
              isNoticeInitiator={isNoticeInitiator}
            />
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div
        className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t"
        style={{ borderColor: "var(--palette-border)" }}
      >
        {activeTab === "incoming" && (
          <>
            <button
              type="button"
              onClick={() => onReject(request._id)}
              disabled={isMutating}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "#fecaca", color: "#dc2626" }}
            >
              <X size={13} />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onAccept(request._id)}
              disabled={isMutating}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#8b64c8" }}
            >
              <CheckCircle size={13} />
              Accept
            </button>
          </>
        )}

        {activeTab === "accepted" && (
          <button
            type="button"
            onClick={() => onCancel(request._id)}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ borderColor: "#fecaca", color: "#dc2626" }}
          >
            <X size={13} />
            Delete
          </button>
        )}

        {activeTab === "termination" && isNoticeInitiator && (
          <button
            type="button"
            onClick={() => onWithdrawTermination(request._id)}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--palette-border)",
              color: "var(--palette-deep)",
              backgroundColor: "var(--palette-card-muted-alt-bg)",
            }}
          >
            <RotateCcw size={13} />
            Withdraw notice
          </button>
        )}
      </div>
    </article>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: RequestsTab }) {
  const messages: Record<RequestsTab, string> = {
    active: "No active rentals right now.",
    incoming: "No pending rental requests.",
    accepted: "No accepted requests waiting for payment.",
    termination: "No termination notices right now.",
  };
  return (
    <div
      className="rounded-2xl border px-6 py-10 text-center text-sm"
      style={{
        borderColor: "var(--palette-border)",
        backgroundColor: "var(--palette-card-bg)",
        color: "var(--palette-soft-purple)",
      }}
    >
      {messages[tab]}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function RentalRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestsTab>("active");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const { user } = useCurrentUser();
  const {
    incomingUnreadCount,
    terminationUnreadCount,
    markIncomingAsRead,
    markTerminationAsRead,
  } = useRentalUnreadCounts();

  const activeRequestsQuery = useOwnerActiveRentRequests();
  const requestsQuery = useOwnerPendingRentRequests();
  const acceptedRequestsQuery = useOwnerAcceptedRentRequests();
  const terminationRequestsQuery = useOwnerTerminationRequests();

  const acceptRequest = useAcceptRentRequest();
  const rejectRequest = useRejectRentRequest();
  const cancelRequest = useCancelRentRequest();
  const createTerminationNotice = useCreateTerminationNotice();
  const withdrawTerminationNotice = useWithdrawTerminationNotice();

  const incomingMarkStartedRef = useRef(false);
  const terminationMarkStartedRef = useRef(false);

  useEffect(() => {
    if (activeTab !== "incoming") {
      incomingMarkStartedRef.current = false;
      return;
    }
    if (incomingMarkStartedRef.current) return;
    incomingMarkStartedRef.current = true;
    void markIncomingAsRead().catch(() => {
      incomingMarkStartedRef.current = false;
    });
  }, [activeTab, markIncomingAsRead]);

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
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeRequests = activeRequestsQuery.data || [];
  const requests = requestsQuery.data || [];
  const acceptedRequests = (acceptedRequestsQuery.data || []).filter(
    (r) =>
      r.status === "RESERVED" &&
      r.paymentDueAt &&
      new Date(r.paymentDueAt).getTime() > nowTick,
  );
  const terminationRequests = terminationRequestsQuery.data || [];

  const visibleRequests =
    activeTab === "active"
      ? activeRequests
      : activeTab === "incoming"
        ? requests
        : activeTab === "accepted"
          ? acceptedRequests
          : terminationRequests;

  const isLoading =
    activeTab === "active"
      ? activeRequestsQuery.isLoading
      : activeTab === "incoming"
        ? requestsQuery.isLoading
        : activeTab === "accepted"
          ? acceptedRequestsQuery.isLoading
          : terminationRequestsQuery.isLoading;

  const isMutating =
    acceptRequest.isPending ||
    rejectRequest.isPending ||
    cancelRequest.isPending ||
    createTerminationNotice.isPending ||
    withdrawTerminationNotice.isPending;

  const handleAccept = async (contractId: string) => {
    try {
      await acceptRequest.mutateAsync({ contractId });
      toast.success("Rental request accepted");
      requestsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept request",
      );
    }
  };

  const handleReject = async (contractId: string) => {
    try {
      await rejectRequest.mutateAsync({ contractId });
      toast.success("Rental request rejected");
      requestsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request",
      );
    }
  };

  const handleCancel = async (contractId: string) => {
    try {
      await cancelRequest.mutateAsync({ contractId });
      toast.success("Rental request deleted");
      requestsQuery.refetch();
      acceptedRequestsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete request",
      );
    }
  };

  const handleCreateTerminationNotice = async (contractId: string) => {
    try {
      await createTerminationNotice.mutateAsync({ contractId });
      toast.success("Termination notice created");
      activeRequestsQuery.refetch();
      terminationRequestsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create termination notice",
      );
    }
  };

  const handleWithdrawTerminationNotice = async (contractId: string) => {
    try {
      await withdrawTerminationNotice.mutateAsync({ contractId });
      toast.success("Termination notice withdrawn");
      activeRequestsQuery.refetch();
      terminationRequestsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to withdraw termination notice",
      );
    }
  };

  const tabs: {
    key: RequestsTab;
    label: string;
    count: number;
    unread?: number;
  }[] = [
    { key: "active", label: "Active rentals", count: activeRequests.length },
    {
      key: "incoming",
      label: "Incoming",
      count: requests.length,
      unread: incomingUnreadCount,
    },
    { key: "accepted", label: "Accepted", count: acceptedRequests.length },
    {
      key: "termination",
      label: "Termination notices",
      count: terminationRequests.length,
      unread: terminationUnreadCount,
    },
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab="rental-requests" />

      <main className="flex-1 px-4 py-10 pt-20">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="mb-1 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                Owner · Rental management
              </p>
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--palette-deep)" }}
              >
                Rental management
              </h1>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                Review active rentals, incoming requests, and termination
                notices.
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ key, label, count, unread }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors inline-flex items-center"
                  style={{
                    backgroundColor: isActive
                      ? "#8b64c8"
                      : "var(--palette-card-bg)",
                    color: isActive ? "#ffffff" : "var(--palette-deep)",
                    border: `1px solid ${isActive ? "#8b64c8" : "var(--palette-border)"}`,
                  }}
                >
                  {label} ({count})
                  {unread != null && <TabUnreadBadge count={unread} />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton h-36 rounded-2xl" />
              ))}
            </div>
          ) : visibleRequests.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-4">
              {visibleRequests.map((request) =>
                activeTab === "active" ? (
                  <ActiveRentalCard
                    key={request._id}
                    request={request}
                    user={user}
                    onCreateTermination={(id) =>
                      void handleCreateTerminationNotice(id)
                    }
                    onWithdrawTermination={(id) =>
                      void handleWithdrawTerminationNotice(id)
                    }
                    isPending={isMutating}
                  />
                ) : (
                  <RequestCard
                    key={request._id}
                    request={request}
                    activeTab={activeTab}
                    user={user}
                    onAccept={(id) => void handleAccept(id)}
                    onReject={(id) => void handleReject(id)}
                    onCancel={(id) => void handleCancel(id)}
                    onWithdrawTermination={(id) =>
                      void handleWithdrawTerminationNotice(id)
                    }
                    isMutating={isMutating}
                    nowTick={nowTick}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default RentalRequestsPage;
