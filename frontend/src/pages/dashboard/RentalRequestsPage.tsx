import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import {
  useAcceptRentRequest,
  useAcceptTerminationRequest,
  useCancelRentRequest,
  useOwnerActiveRentRequests,
  useOwnerAcceptedRentRequests,
  useOwnerTerminationRequests,
  useOwnerPendingRentRequests,
  useMarkRentalNotificationsRead,
  useRejectTerminationRequest,
  useRejectRentRequest,
} from "../../features/message/hooks/useMessageHooks";
import type { RentRequest } from "../../features/message/types/type";
import { palette } from "../../theme/palette";

type RequestsTab = "active" | "incoming" | "accepted" | "termination";

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

const getRequesterId = (request: RentRequest) => {
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

function RentalRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestsTab>("active");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const rentalNotificationsMarkedRef = useRef(false);
  const { user } = useCurrentUser();
  const activeRequestsQuery = useOwnerActiveRentRequests();
  const requestsQuery = useOwnerPendingRentRequests();
  const acceptedRequestsQuery = useOwnerAcceptedRentRequests();
  const terminationRequestsQuery = useOwnerTerminationRequests();
  const markRentalNotificationsRead = useMarkRentalNotificationsRead();
  const acceptRequest = useAcceptRentRequest();
  const rejectRequest = useRejectRentRequest();
  const cancelRequest = useCancelRentRequest();
  const acceptTerminationRequest = useAcceptTerminationRequest();
  const rejectTerminationRequest = useRejectTerminationRequest();

  useEffect(() => {
    if (!user || rentalNotificationsMarkedRef.current) return;

    rentalNotificationsMarkedRef.current = true;
    markRentalNotificationsRead.mutate();
  }, [markRentalNotificationsRead, user]);

  const activeRequests = activeRequestsQuery.data || [];
  const requests = requestsQuery.data || [];
  const acceptedRequests = (acceptedRequestsQuery.data || []).filter(
    (request) =>
      request.status === "RESERVED" &&
      request.paymentDueAt &&
      new Date(request.paymentDueAt).getTime() > nowTick,
  );

  const terminationRequests = terminationRequestsQuery.data || [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleAccept = async (contractId: string) => {
    try {
      await acceptRequest.mutateAsync({ contractId });
      toast.success("Rental request accepted");
      requestsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept request";
      toast.error(message);
    }
  };

  const handleReject = async (contractId: string) => {
    try {
      await rejectRequest.mutateAsync({ contractId });
      toast.success("Rental request rejected");
      requestsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject request";
      toast.error(message);
    }
  };

  const handleCancel = async (contractId: string) => {
    try {
      await cancelRequest.mutateAsync({ contractId });
      toast.success("Rental request deleted");
      requestsQuery.refetch();
      acceptedRequestsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete request";
      toast.error(message);
    }
  };

  const handleAcceptTermination = async (contractId: string) => {
    try {
      await acceptTerminationRequest.mutateAsync({ contractId });
      toast.success("Termination accepted");
      terminationRequestsQuery.refetch();
      acceptedRequestsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to accept termination request";
      toast.error(message);
    }
  };

  const handleRejectTermination = async (contractId: string) => {
    try {
      await rejectTerminationRequest.mutateAsync({ contractId });
      toast.success("Termination rejected");
      terminationRequestsQuery.refetch();
      acceptedRequestsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reject termination request";
      toast.error(message);
    }
  };

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

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      <DashboardNavbar activeTab="rental-requests" />

      <main className="flex-1 px-4 py-10 pt-24">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              Rental Management
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Review active rentals, incoming requests, and termination cases.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  activeTab === "active" ? palette.purple : palette.cardBg,
                color: activeTab === "active" ? palette.pageBg : palette.deep,
                border: `1px solid ${palette.border}`,
              }}
            >
              Active Rentals ({activeRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("incoming")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  activeTab === "incoming" ? palette.purple : palette.cardBg,
                color: activeTab === "incoming" ? palette.pageBg : palette.deep,
                border: `1px solid ${palette.border}`,
              }}
            >
              Incoming ({requests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("accepted")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  activeTab === "accepted" ? palette.purple : palette.cardBg,
                color: activeTab === "accepted" ? palette.pageBg : palette.deep,
                border: `1px solid ${palette.border}`,
              }}
            >
              Accepted ({acceptedRequests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("termination")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  activeTab === "termination" ? palette.purple : palette.cardBg,
                color:
                  activeTab === "termination" ? palette.pageBg : palette.deep,
                border: `1px solid ${palette.border}`,
              }}
            >
              Termination Requests ({terminationRequests.length})
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
          ) : visibleRequests.length === 0 ? (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: palette.border, color: palette.softPurple }}
            >
              {activeTab === "active"
                ? "No active rentals right now."
                : activeTab === "incoming"
                  ? "No pending rental requests."
                  : activeTab === "accepted"
                    ? "No accepted requests waiting for payment."
                    : "No termination requests right now."}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleRequests.map((request) => {
                const listingId = getListingId(request.listingId);
                const listingTitle = getListingTitle(request.listingId);
                const listing = getListing(request.listingId);
                const tenantName = getPartyName(request.tenantId);
                const requesterId = getRequesterId(request);
                const requesterIsCurrentUser = requesterId === user?.id;
                const isMutating =
                  acceptRequest.isPending ||
                  rejectRequest.isPending ||
                  cancelRequest.isPending ||
                  acceptTerminationRequest.isPending ||
                  rejectTerminationRequest.isPending;

                return activeTab === "active" ? (
                  <article
                    key={request._id}
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.cardBg,
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Property title
                        </p>
                        <Link
                          to={`/properties/${listingId}`}
                          className="text-xl font-bold hover:underline"
                          style={{ color: palette.deep }}
                        >
                          {listingTitle}
                        </Link>

                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Property location
                        </p>
                        <p className="text-sm" style={{ color: palette.deep }}>
                          {[listing?.city, listing?.address]
                            .filter(Boolean)
                            .join(", ") || "Location not available"}
                        </p>

                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Monthly rent
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: palette.deep }}
                        >
                          {listing?.price != null
                            ? `${new Intl.NumberFormat().format(listing.price)} ${listing.currency || "ETB"}/mo`
                            : "Price not available"}
                        </p>

                        <div
                          className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: "#E8F8F0",
                            color: "#0F7A4A",
                          }}
                        >
                          Active Rental
                        </div>

                        <p
                          className="mt-4 text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Tenant name
                        </p>
                        <p
                          className="text-base font-semibold"
                          style={{ color: palette.deep }}
                        >
                          {tenantName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/message?conversationId=${request.conversationId}`}
                          className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Open Chat
                        </Link>
                        <Link
                          to={`/dashboard/receipts/${request._id}`}
                          className="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
                        >
                          View Receipt
                        </Link>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    key={request._id}
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.cardBg,
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Tenant
                        </p>
                        <p
                          className="text-base font-semibold"
                          style={{ color: palette.deep }}
                        >
                          {tenantName}
                        </p>

                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: palette.softPurple }}
                        >
                          Listing
                        </p>
                        <Link
                          to={`/properties/${listingId}`}
                          className="text-base font-semibold hover:underline"
                          style={{ color: palette.purple }}
                        >
                          {listingTitle}
                        </Link>

                        {request.status === "RESERVED" ? (
                          <div
                            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: palette.chipBg,
                              color: palette.deep,
                            }}
                          >
                            Payment due
                            <span>
                              {formatRemainingTime(request.paymentDueAt)}
                            </span>
                          </div>
                        ) : null}

                        {activeTab === "termination" ? (
                          <div
                            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: palette.chipBg,
                              color: palette.deep,
                            }}
                          >
                            {requesterIsCurrentUser
                              ? "Waiting for the other party"
                              : "Your response is required"}
                          </div>
                        ) : null}

                        {activeTab === "termination" ? (
                          <p
                            className="mt-2 text-xs"
                            style={{ color: palette.softPurple }}
                          >
                            Requested by{" "}
                            {typeof request.terminationRequestedBy === "string"
                              ? "the other party"
                              : (request.terminationRequestedBy?.name ??
                                "the other party")}
                          </p>
                        ) : null}

                        {activeTab === "termination" ? (
                          <div
                            className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{
                              borderColor: "#F59E0B",
                              backgroundColor: "#FFFBEB",
                              color: "#B45309",
                            }}
                          >
                            Explicit notice: if you do not accept or reject
                            within 30 days, this termination request will be
                            automatically accepted.
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {activeTab === "incoming" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void handleAccept(request._id);
                              }}
                              disabled={isMutating}
                              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleReject(request._id);
                              }}
                              disabled={isMutating}
                              className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : activeTab === "accepted" ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleCancel(request._id);
                            }}
                            disabled={isMutating}
                            className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Delete
                          </button>
                        ) : requesterIsCurrentUser ? null : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void handleAcceptTermination(request._id);
                              }}
                              disabled={isMutating}
                              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleRejectTermination(request._id);
                              }}
                              disabled={isMutating}
                              className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default RentalRequestsPage;
