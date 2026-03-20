import { useEffect, useState } from "react";
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
import { useMyPropertiesOverview } from "../hooks/useDashboardHooks";
import { palette } from "../../../theme/palette";

function MyPropertyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProperty = useUpdateCreatorProperty();
  const deleteProperty = useDeleteCreatorProperty();
  const [page, setPage] = useState(1);
  const [markingRentedPropertyId, setMarkingRentedPropertyId] = useState<
    string | null
  >(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(
    null,
  );
  const [openMenuPropertyId, setOpenMenuPropertyId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError } = useMyPropertiesOverview({
    page,
    limit: 20,
  });

  const properties = data?.properties ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => {
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
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
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
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                          style={{ color: palette.deep }}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleMarkAsRented(
                              property._id,
                              property.status,
                            )
                          }
                          disabled={markingRentedPropertyId === property._id}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                          style={{ color: palette.deep }}
                        >
                          <CircleCheck size={16} />
                          {markingRentedPropertyId === property._id
                            ? "Marking..."
                            : "Mark as Rented"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteProperty(property._id)
                          }
                          disabled={deletingPropertyId === property._id}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-red-50"
                          style={{ color: "#E11D48" }}
                        >
                          <Trash2 size={16} />
                          {deletingPropertyId === property._id
                            ? "Deleting..."
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
    </>
  );
}

export default MyPropertyList;
