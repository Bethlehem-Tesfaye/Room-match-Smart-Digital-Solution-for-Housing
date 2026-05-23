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
  useAcceptTerminationRequest,
  useCancelRentRequest,
  useCreateTerminationRequest,
  useMarkRentalNotificationsRead,
  useRejectTerminationRequest,
  useTenantRentalContracts,
} from "../../features/message/hooks/useMessageHooks";
import type {
  ContractStatus,
  ConversationListing,
  RentRequest,
  RentRequestParty,
} from "../../features/message/types/type";
import { palette } from "../../theme/palette";

type RentalsTab = "requested" | "rented" | "termination" | "history";

const pendingPaymentStorageKey = "pending_rental_payment_contract_id";

const getListing = (
  listing: RentRequest["listingId"],
): ConversationListing | null => {
  return typeof listing === "string" ? null : listing;
};

const getParty = (party: RentRequest["ownerId"]): RentRequestParty | null => {
  return typeof party === "string" ? null : party;
};

const getTerminationRequester = (
  requester: RentRequest["terminationRequestedBy"],
): RentRequestParty | null => {
  return typeof requester === "string" ? null : (requester ?? null);
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
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-700",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-zinc-100 text-zinc-700",
      };
    case "PENDING":
      return {
        label: "Request Sent",
        className: "bg-sky-100 text-sky-700",
      };
    case "TERMINATION_PENDING":
      return {
        label: "Termination Pending",
        className: "bg-orange-100 text-orange-700",
      };
    case "TERMINATED":
      return {
        label: "Terminated",
        className: "bg-zinc-100 text-zinc-700",
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

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
};

function MyRentalsPage() {
  const [activeTab, setActiveTab] = useState<RentalsTab>("requested");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingPaymentContractId, setPendingPaymentContractId] = useState<
    string | null
  >(null);
  const paymentReturnHandledRef = useRef(false);
  const rentalNotificationsMarkedRef = useRef(false);
  const { user } = useCurrentUser();
  const rentalsQuery = useTenantRentalContracts();
  const markRentalNotificationsRead = useMarkRentalNotificationsRead();
  const cancelRentRequest = useCancelRentRequest();
  const createTerminationRequest = useCreateTerminationRequest();
  const acceptTerminationRequest = useAcceptTerminationRequest();
  const rejectTerminationRequest = useRejectTerminationRequest();

  useEffect(() => {
    if (!user || rentalNotificationsMarkedRef.current) return;

    rentalNotificationsMarkedRef.current = true;
    markRentalNotificationsRead.mutate();
  }, [markRentalNotificationsRead, user]);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") {
      paymentReturnHandledRef.current = false;
      return;
    }

    if (paymentReturnHandledRef.current) {
      return;
    }

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

  const terminationContracts = useMemo(
    () =>
      contracts.filter((contract) => contract.status === "TERMINATION_PENDING"),
    [contracts],
  );

  const historyContracts = useMemo(
    () =>
      contracts.filter((contract) =>
        ["REJECTED", "CANCELLED", "TERMINATED"].includes(contract.status),
      ),
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
      const message =
        error instanceof Error ? error.message : "Failed to cancel request";
      toast.error(message);
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

      if (!checkoutUrl) {
        throw new Error("Missing checkout URL");
      }

      window.localStorage.setItem(pendingPaymentStorageKey, contractId);

      window.location.href = checkoutUrl;
    } catch (error) {
      const message = getErrorMessage(error) || "Failed to start payment";
      toast.error(message);
      window.localStorage.removeItem(pendingPaymentStorageKey);
    } finally {
      setPendingPaymentContractId(null);
    }
  };

  const handleSendTerminationRequest = async (contractId: string) => {
    try {
      await createTerminationRequest.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Termination request sent");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send termination request";
      toast.error(message);
    }
  };

  const handleAcceptTermination = async (contractId: string) => {
    try {
      await acceptTerminationRequest.mutateAsync({ contractId });
      await rentalsQuery.refetch();
      toast.success("Termination accepted");
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
      await rentalsQuery.refetch();
      toast.success("Termination rejected");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reject termination request";
      toast.error(message);
    }
  };

  const isTerminationRequester = (contract: RentRequest) => {
    const requester = contract.terminationRequestedBy;
    const requesterId =
      typeof requester === "string" ? requester : requester?._id;

    return requesterId === user?.id;
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
            Termination ({terminationContracts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor:
                activeTab === "history" ? palette.purple : palette.cardBg,
              color: activeTab === "history" ? palette.pageBg : palette.deep,
              border: `1px solid ${palette.border}`,
            }}
          >
            History ({historyContracts.length})
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
                : activeTab === "rented"
                  ? "You do not have any active rentals yet."
                  : activeTab === "termination"
                    ? "No termination requests right now."
                    : "No rental history yet."}
            </div>
          ) : (
            visibleContracts.map((contract) => {
              const listing = getListing(contract.listingId);
              const owner = getParty(contract.ownerId);
              const statusMeta = getStatusMeta(contract.status);
              const listingStateMeta = getListingStateMeta(listing);
              const canCompletePayment =
                contract.status === "RESERVED" &&
                contract.paymentDueAt &&
                new Date(contract.paymentDueAt).getTime() > nowTick;
              const isCompletingThisPayment =
                pendingPaymentContractId === contract._id;

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
                            {activeTab === "requested"
                              ? contract.status === "RESERVED"
                                ? "Payment is pending. The request will disappear automatically if payment is not completed in time."
                                : "Your request is recorded and waiting for owner response."
                              : activeTab === "rented"
                                ? "Your rental is active and tracked here."
                                : activeTab === "termination"
                                  ? "A termination decision is waiting for the other party."
                                  : contract.status === "REJECTED"
                                    ? "This request was rejected by the owner, and you can send a new request later."
                                    : contract.status === "CANCELLED"
                                      ? "This request was cancelled and remains in your history."
                                      : "This rental has been terminated and is stored in your history."}
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

                          {activeTab === "termination" ? (
                            <div
                              className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: palette.chipBg,
                                color: palette.deep,
                              }}
                            >
                              {isTerminationRequester(contract)
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
                              {getTerminationRequester(
                                contract.terminationRequestedBy,
                              )?.name ??
                                (isTerminationRequester(contract)
                                  ? "you"
                                  : "the other party")}
                            </p>
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
                      {activeTab === "requested" && canCompletePayment ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleCompletePayment(contract._id)
                          }
                          disabled={isCompletingThisPayment}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: "#059669" }}
                        >
                          {isCompletingThisPayment
                            ? "Redirecting..."
                            : "Complete Payment"}
                        </button>
                      ) : null}

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
                      ) : activeTab === "rented" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleSendTerminationRequest(contract._id)
                          }
                          disabled={createTerminationRequest.isPending}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: palette.softPurple }}
                        >
                          Send Termination Request
                        </button>
                      ) : activeTab === "termination" ? (
                        isTerminationRequester(contract) ? null : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void handleAcceptTermination(contract._id)
                              }
                              disabled={acceptTerminationRequest.isPending}
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleRejectTermination(contract._id)
                              }
                              disabled={rejectTerminationRequest.isPending}
                              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )
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
