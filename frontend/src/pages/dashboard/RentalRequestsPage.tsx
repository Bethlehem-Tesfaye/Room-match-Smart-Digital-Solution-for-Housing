import { Link } from "react-router-dom";
import { toast } from "sonner";
import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import {
  useAcceptRentRequest,
  useOwnerPendingRentRequests,
  useRejectRentRequest,
} from "../../features/message/hooks/useMessageHooks";
import type { RentRequest } from "../../features/message/types/type";
import { palette } from "../../theme/palette";

const getPartyName = (party: RentRequest["tenantId"]) => {
  if (typeof party === "string") return party;
  return party.name || party.email || party._id;
};

const getListingTitle = (listing: RentRequest["listingId"]) => {
  if (typeof listing === "string") return "Listing";
  return listing.title || "Listing";
};

const getListingId = (listing: RentRequest["listingId"]) => {
  if (typeof listing === "string") return listing;
  return listing._id;
};

function RentalRequestsPage() {
  const requestsQuery = useOwnerPendingRentRequests();
  const acceptRequest = useAcceptRentRequest();
  const rejectRequest = useRejectRentRequest();

  const requests = requestsQuery.data || [];

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
              Rental Requests
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Review and respond to pending rent requests.
            </p>
          </div>

          {requestsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: palette.border, color: palette.softPurple }}
            >
              No pending rental requests.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const listingId = getListingId(request.listingId);
                const listingTitle = getListingTitle(request.listingId);
                const tenantName = getPartyName(request.tenantId);
                const isMutating =
                  acceptRequest.isPending || rejectRequest.isPending;

                return (
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
                      </div>

                      <div className="flex items-center gap-2">
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
