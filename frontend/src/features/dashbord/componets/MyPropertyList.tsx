import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  EllipsisVertical,
  Eye,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useDeleteCreatorProperty,
  useUpdateCreatorProperty,
} from "../../addListing/hooks/useCreatorPropertyHooks";
import PropertyPagination from "../../property/components/PropertyPagination";
import {
  useCreateTerminationRequest,
  useOwnerActiveRentRequests,
  useOwnerTerminationRequests,
} from "../../message/hooks/useMessageHooks";
import { useMyPropertiesOverview } from "../hooks/useDashboardHooks";
import { palette } from "../../../theme/palette";
import useIsDark from "../../../lib/useTheme";

type PropertyFilterTab = "all" | "rented";

const getListingId = (listing: { _id: string } | string) =>
  typeof listing === "string" ? listing : listing._id;

function DeleteTerminationModal({
  isOpen,
  propertyTitle,
  isSubmitting,
  onClose,
  onSendTerminationRequest,
}: {
  isOpen: boolean;
  propertyTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSendTerminationRequest: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
        style={{ borderColor: "#E7E1FA" }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-bold" style={{ color: palette.deep }}>
          Send termination request first
        </h3>
        <p className="mt-2 text-sm" style={{ color: palette.purple }}>
          To delete {propertyTitle}, you must send a contract termination
          request to the rented tenant first.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: palette.border, color: palette.deep }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSendTerminationRequest}
            disabled={isSubmitting}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: palette.purple }}
          >
            {isSubmitting ? "Sending..." : "Send Termination Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MyPropertyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProperty = useUpdateCreatorProperty();
  const deleteProperty = useDeleteCreatorProperty();
  const createTerminationRequest = useCreateTerminationRequest();
  const [page, setPage] = useState(1);
  const [markingRentedPropertyId, setMarkingRentedPropertyId] = useState<
    string | null
  >(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(
    null,
  );
  const [terminationProperty, setTerminationProperty] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [openMenuPropertyId, setOpenMenuPropertyId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<PropertyFilterTab>("all");

  const { data, isLoading, isError } = useMyPropertiesOverview({
    page,
    limit: 20,
  });

  const properties = data?.properties ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;
  const isDark = useIsDark();
  const activeRentalsQuery = useOwnerActiveRentRequests();
  const terminationRequestsQuery = useOwnerTerminationRequests();

  const activeRentalByPropertyId = useMemo(() => {
    return new Map(
      (activeRentalsQuery.data ?? []).map((contract) => [
        getListingId(contract.listingId),
        contract,
      ]),
    );
  }, [activeRentalsQuery.data]);

  const terminationRequestByPropertyId = useMemo(() => {
    return new Map(
      (terminationRequestsQuery.data ?? []).map((contract) => [
        getListingId(contract.listingId),
        contract,
      ]),
    );
  }, [terminationRequestsQuery.data]);

  const visibleProperties = useMemo(() => {
    if (activeTab === "rented") {
      return properties.filter((property) => property.status === "Rented");
    }

    return properties;
  }, [activeTab, properties]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-my-property-menu-root]")) {
        return;
      }

      setOpenMenuPropertyId(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleMarkAsRented = async (propertyId: string, status?: string) => {
    if (status === "Rented") {
      toast.info("This listing is already marked as rented.");
      setOpenMenuPropertyId(null);
      return;
    }

    setMarkingRentedPropertyId(propertyId);

    try {
      await updateProperty.mutateAsync({
        propertyId,
        payload: { status: "Rented" },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "my-properties-overview"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "listing-counts"],
        }),
      ]);

      toast.success("Listing marked as rented.");
      setOpenMenuPropertyId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update listing";
      toast.error(message);
    } finally {
      setMarkingRentedPropertyId(null);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    setDeletingPropertyId(propertyId);

    try {
      await deleteProperty.mutateAsync({ propertyId });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "my-properties-overview"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "listing-counts"],
        }),
      ]);

      toast.success("Listing deleted successfully.");
      setOpenMenuPropertyId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete listing";
      toast.error(message);
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const handleSendTerminationRequest = async (propertyId: string) => {
    const activeContract = activeRentalByPropertyId.get(propertyId);

    if (!activeContract) {
      const pendingContract = terminationRequestByPropertyId.get(propertyId);

      if (pendingContract) {
        toast.info(
          "A termination request is already pending for this property.",
        );
      } else {
        toast.error("No active rental contract found for this property.");
      }

      setTerminationProperty(null);
      setOpenMenuPropertyId(null);
      return;
    }

    try {
      await createTerminationRequest.mutateAsync({
        contractId: activeContract._id,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "my-properties-overview"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "listing-counts"],
        }),
      ]);

      toast.success("Termination request sent.");
      setTerminationProperty(null);
      setOpenMenuPropertyId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send termination request";
      toast.error(message);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-2xl border p-6 text-sm"
          style={{ borderColor: "#E1D8FA", color: palette.purple }}
        >
          Couldn&apos;t load your properties right now.
        </div>
      ) : properties.length === 0 ? (
        <div
          className="rounded-2xl border p-6 text-sm"
          style={{ borderColor: "#E1D8FA", color: palette.purple }}
        >
          No properties found.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  activeTab === "all" ? palette.purple : palette.cardBg,
                color: activeTab === "all" ? palette.pageBg : palette.deep,
                border: `1px solid ${palette.border}`,
              }}
            >
              All
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
              Rented
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProperties.map((property) => {
              const primaryImage =
                property.images.find((image) => image.isPrimary) ??
                property.images[0];

              return (
                <article
                  key={property._id}
                  className="relative overflow-visible rounded-2xl border bg-white shadow-sm"
                  style={{ borderColor: palette.border }}
                >
                  <div
                    className="absolute right-3 top-3 z-30"
                    data-my-property-menu-root
                  >
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white/90"
                      style={{
                        borderColor: palette.border,
                        color: palette.deep,
                        backgroundColor: palette.pageBg,
                      }}
                      onClick={() =>
                        setOpenMenuPropertyId((prev) =>
                          prev === property._id ? null : property._id,
                        )
                      }
                      aria-label="Open listing actions"
                    >
                      <EllipsisVertical size={18} />
                    </button>

                    {openMenuPropertyId === property._id ? (
                      <div
                        className="absolute right-0 mt-2 z-30 w-52 rounded-xl border p-2 shadow-sm"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.cardBg,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/properties/preview/${property._id}`)
                          }
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                          }`}
                          style={{ color: palette.deep }}
                        >
                          <Eye size={16} />
                          Get Preview
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/properties/${property._id}/edit`)
                          }
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                          }`}
                          style={{ color: palette.deep }}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        {property.status === "Rented" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTerminationProperty({
                                id: property._id,
                                title: property.title,
                              });
                              setOpenMenuPropertyId(null);
                            }}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                              isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                            }`}
                            style={{ color: palette.deep }}
                          >
                            <CircleCheck size={16} />
                            {terminationRequestByPropertyId.has(property._id)
                              ? "Termination Pending"
                              : "Send Termination Request"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void handleMarkAsRented(
                                property._id,
                                property.status,
                              )
                            }
                            disabled={markingRentedPropertyId === property._id}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                              isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                            }`}
                            style={{ color: palette.deep }}
                          >
                            <CircleCheck size={16} />
                            {markingRentedPropertyId === property._id
                              ? "Marking..."
                              : "Mark as Rented"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (property.status === "Rented") {
                              setTerminationProperty({
                                id: property._id,
                                title: property.title,
                              });
                              setOpenMenuPropertyId(null);
                              return;
                            }

                            void handleDeleteProperty(property._id);
                          }}
                          disabled={deletingPropertyId === property._id}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-200"
                          style={{ color: "#E11D48" }}
                        >
                          <Trash2 size={16} />
                          {deletingPropertyId === property._id
                            ? "Deleting..."
                            : property.status === "Rented"
                              ? "Delete Property"
                              : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="h-48 w-full overflow-hidden rounded-t-2xl"
                    style={{ backgroundColor: palette.cardMutedBg }}
                  >
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center text-sm"
                        style={{ color: palette.softPurple }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="line-clamp-1 text-lg font-bold"
                      style={{ color: palette.deep }}
                    >
                      {property.title}
                    </h3>

                    <p
                      className="mt-2 flex items-center gap-1 text-sm"
                      style={{ color: palette.purple }}
                    >
                      <MapPin size={14} />
                      {property.city}
                    </p>

                    <p
                      className="mt-1 line-clamp-1 text-sm"
                      style={{ color: palette.softPurple }}
                    >
                      {property.address}
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      <p
                        className="text-2xl font-extrabold"
                        style={{ color: palette.purple }}
                      >
                        {property.currency}{" "}
                        {new Intl.NumberFormat().format(property.price)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: palette.softPurple }}
                      >
                        {property.numberOfBedrooms} bd |{" "}
                        {property.numberOfBathrooms} ba
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <PropertyPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <DeleteTerminationModal
        isOpen={terminationProperty !== null}
        propertyTitle={terminationProperty?.title ?? "this property"}
        isSubmitting={createTerminationRequest.isPending}
        onClose={() => setTerminationProperty(null)}
        onSendTerminationRequest={() => {
          if (!terminationProperty) return;

          void handleSendTerminationRequest(terminationProperty.id);
        }}
      />
    </>
  );
}

export default MyPropertyList;
