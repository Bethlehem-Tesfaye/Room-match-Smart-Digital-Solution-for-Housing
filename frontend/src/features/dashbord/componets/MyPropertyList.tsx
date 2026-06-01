import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CircleCheck,
  EllipsisVertical,
  Eye,
  Home,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteCreatorProperty } from "../../addListing/hooks/useCreatorPropertyHooks";
import PropertyPagination from "../../property/components/PropertyPagination";
import {
  useCreateTerminationRequest,
  useOwnerActiveRentRequests,
  useOwnerTerminationRequests,
} from "../../message/hooks/useMessageHooks";
import { useMyPropertiesOverview } from "../hooks/useDashboardHooks";
import useIsDark from "../../../lib/useTheme";

type PropertyFilterTab = "all" | "rented";

const getListingId = (listing: { _id: string } | string) =>
  typeof listing === "string" ? listing : listing._id;

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Active: { bg: "#e6f9f0", color: "#166534", border: "#bbf7d0" },
  Rented: { bg: "#f0ebff", color: "#8b64c8", border: "#ddd6fe" },
  Reserved: { bg: "#fef9ec", color: "#92400e", border: "#fde68a" },
};

const DARK_STATUS_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Active: {
    bg: "rgba(74,222,128,0.1)",
    color: "#4ade80",
    border: "rgba(74,222,128,0.2)",
  },
  Rented: {
    bg: "rgba(176,142,224,0.1)",
    color: "#b08ee0",
    border: "rgba(176,142,224,0.2)",
  },
  Reserved: {
    bg: "rgba(252,211,77,0.1)",
    color: "#fcd34d",
    border: "rgba(252,211,77,0.2)",
  },
};

// ── Termination modal ─────────────────────────────────────────────────────────
function DeleteTerminationModal({
  isOpen,
  propertyTitle,
  isSubmitting,
  onClose,
  onSendTerminationRequest,
  isDark,
}: {
  isOpen: boolean;
  propertyTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSendTerminationRequest: () => void;
  isDark: boolean;
}) {
  if (!isOpen) return null;

  const cardBg = isDark ? "#17112e" : "#ffffff";
  const border = isDark ? "#3a2d5c" : "#e5d9f9";
  const deep = isDark ? "#ede9f8" : "#2e1f4a";
  const muted = isDark ? "#9b78d4" : "#a98fd4";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div
          className="border-b px-5 py-4"
          style={{
            borderColor: border,
            backgroundColor: isDark ? "#1f1838" : "#f7f4ff",
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: muted }}
          >
            Action required
          </p>
          <h3 className="mt-1 text-base font-semibold" style={{ color: deep }}>
            Send termination notice first
          </h3>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed" style={{ color: muted }}>
            To delete{" "}
            <span className="font-medium" style={{ color: deep }}>
              {propertyTitle}
            </span>
            , you must first notify the current tenant via a termination notice.
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex gap-2 border-t px-5 py-4"
          style={{ borderColor: border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
            style={{
              borderColor: border,
              color: deep,
              backgroundColor: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSendTerminationRequest}
            disabled={isSubmitting}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#8b64c8" }}
          >
            {isSubmitting ? "Sending…" : "Send notice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu button ───────────────────────────────────────────────────────────────
function MenuBtn({
  icon,
  label,
  color,
  hoverBg,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverBg: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-40"
      style={{ color }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function MyPropertyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteProperty = useDeleteCreatorProperty();
  const createTerminationRequest = useCreateTerminationRequest();
  const [page, setPage] = useState(1);
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
  const isDark = useIsDark();

  const { data, isLoading, isError } = useMyPropertiesOverview({
    page,
    limit: 20,
  });
  const properties = data?.properties ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  const activeRentalsQuery = useOwnerActiveRentRequests();
  const terminationRequestsQuery = useOwnerTerminationRequests();

  const activeRentalByPropertyId = useMemo(
    () =>
      new Map(
        (activeRentalsQuery.data ?? []).map((c) => [
          getListingId(c.listingId),
          c,
        ]),
      ),
    [activeRentalsQuery.data],
  );

  const terminationRequestByPropertyId = useMemo(
    () =>
      new Map(
        (terminationRequestsQuery.data ?? []).map((c) => [
          getListingId(c.listingId),
          c,
        ]),
      ),
    [terminationRequestsQuery.data],
  );

  const visibleProperties = useMemo(
    () =>
      activeTab === "rented"
        ? properties.filter((p) => p.status === "Rented")
        : properties,
    [activeTab, properties],
  );

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest("[data-my-property-menu-root]"))
        setOpenMenuPropertyId(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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
      toast.error(
        error instanceof Error ? error.message : "Failed to delete listing",
      );
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const handleSendTerminationRequest = async (propertyId: string) => {
    const activeContract = activeRentalByPropertyId.get(propertyId);
    if (!activeContract) {
      const pending = terminationRequestByPropertyId.get(propertyId);
      toast[pending ? "info" : "error"](
        pending
          ? "A termination request is already pending."
          : "No active rental contract found.",
      );
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
      toast.success("Termination notice sent.");
      setTerminationProperty(null);
      setOpenMenuPropertyId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send termination notice",
      );
    }
  };

  // ── Style tokens ──────────────────────────────────────────────────────────
  const deep = isDark ? "#ede9f8" : "#2e1f4a";
  const muted = isDark ? "#9b78d4" : "#a98fd4";
  const border = isDark ? "#3a2d5c" : "#e5d9f9";
  const cardBg = isDark ? "#17112e" : "#ffffff";
  const mutedBg = isDark ? "#1f1838" : "#f7f4ff";
  const chipBg = isDark ? "#251c42" : "#ede7fd";
  const menuBg = isDark ? "#1f1838" : "#ffffff";
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "#f5f1ff";
  const accent = "#8b64c8";

  const statusMap = isDark ? DARK_STATUS_COLORS : STATUS_COLORS;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border"
            style={{ backgroundColor: cardBg, borderColor: border }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: border, backgroundColor: mutedBg }}
            >
              <div className="skeleton h-2.5 w-20 rounded" />
              <div className="skeleton h-4 w-14 rounded-md" />
            </div>
            <div className="skeleton h-44 w-full" />
            <div className="flex flex-col gap-2 p-4">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
            <div
              className="flex items-center justify-between border-t px-4 py-3"
              style={{ borderColor: border }}
            >
              <div className="skeleton h-5 w-24 rounded" />
              <div className="skeleton h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="rounded-2xl border px-5 py-8 text-center text-sm"
        style={{ borderColor: border, color: muted }}
      >
        Couldn't load your properties right now.
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (properties.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-16"
        style={{ borderColor: border, backgroundColor: cardBg }}
      >
        <Home
          size={32}
          style={{ color: muted }}
          strokeWidth={1.5}
          className="mb-3"
        />
        <p className="text-sm font-medium" style={{ color: deep }}>
          No listings yet
        </p>
        <p className="mt-0.5 text-xs" style={{ color: muted }}>
          Properties you add will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-5 flex items-center gap-2">
        {(["all", "rented"] as PropertyFilterTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? accent : cardBg,
                color: isActive ? "#ffffff" : deep,
                border: `1px solid ${isActive ? accent : border}`,
              }}
            >
              {tab === "all" ? "All listings" : "Rented"}
            </button>
          );
        })}

        <span
          className="ml-auto font-mono text-[10px] uppercase tracking-widest"
          style={{ color: muted }}
        >
          {visibleProperties.length} total
        </span>
      </div>

      {/* Bento grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProperties.map((property) => {
          const primaryImage =
            property.images.find((img) => img.isPrimary) ?? property.images[0];
          const sc = statusMap[property.status] ?? {
            bg: chipBg,
            color: deep,
            border,
          };
          const isMenuOpen = openMenuPropertyId === property._id;

          return (
            <article
              key={property._id}
              className="group relative flex flex-col overflow-visible rounded-2xl border transition-shadow duration-200"
              style={{
                backgroundColor: cardBg,
                borderColor: border,
                boxShadow: isDark
                  ? "0 1px 4px rgba(0,0,0,0.3)"
                  : "0 1px 4px rgba(46,31,74,0.06)",
              }}
            >
              {/* ── Bento header strip ── */}
              <div
                className="flex items-center justify-between border-b px-4 py-2.5"
                style={{ borderColor: border, backgroundColor: mutedBg }}
              >
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: muted }}
                >
                  #{property._id.slice(-4).toUpperCase()}
                </span>
                <span
                  className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: sc.bg,
                    color: sc.color,
                    borderColor: sc.border,
                  }}
                >
                  {property.status}
                </span>
              </div>

              {/* ── Image ── */}
              <div
                className="h-44 w-full overflow-hidden"
                style={{ backgroundColor: isDark ? "#1f1838" : "#f0ebff" }}
              >
                {primaryImage ? (
                  <img
                    src={primaryImage.imageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-2"
                    style={{ color: muted }}
                  >
                    <Building2 size={24} strokeWidth={1.5} />
                    <span className="font-mono text-xs uppercase tracking-wider">
                      No image
                    </span>
                  </div>
                )}
              </div>

              {/* ── Body ── */}
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h3
                  className="line-clamp-1 text-sm font-semibold leading-snug"
                  style={{ color: deep }}
                >
                  {property.title}
                </h3>
                <p
                  className="flex items-center gap-1 text-xs"
                  style={{ color: muted }}
                >
                  <MapPin size={11} />
                  {property.city}
                </p>
                <p
                  className="line-clamp-1 text-xs"
                  style={{ color: muted, opacity: 0.7 }}
                >
                  {property.address}
                </p>
              </div>

              {/* ── Bento footer strip ── */}
              <div
                className="flex items-center justify-between border-t px-4 py-3"
                style={{ borderColor: border }}
              >
                <div>
                  <p
                    className="text-base font-bold leading-none"
                    style={{ color: accent }}
                  >
                    {property.currency}{" "}
                    {new Intl.NumberFormat().format(property.price)}
                  </p>
                  <p
                    className="mt-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: muted }}
                  >
                    {property.numberOfBedrooms} bd ·{" "}
                    {property.numberOfBathrooms} ba
                  </p>
                </div>

                {/* ── Menu ── */}
                <div className="relative" data-my-property-menu-root>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuPropertyId(isMenuOpen ? null : property._id)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    style={{
                      color: muted,
                      backgroundColor: isMenuOpen ? chipBg : "transparent",
                      border: `1px solid ${isMenuOpen ? border : "transparent"}`,
                    }}
                    aria-label="Listing actions"
                  >
                    <EllipsisVertical size={14} />
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute bottom-full right-0 z-30 mb-1.5 w-52 overflow-hidden rounded-xl shadow-xl"
                      style={{
                        backgroundColor: menuBg,
                        border: `1px solid ${border}`,
                      }}
                    >
                      <div className="p-1">
                        <MenuBtn
                          icon={<Eye size={13} />}
                          label="Preview"
                          color={deep}
                          hoverBg={hoverBg}
                          onClick={() =>
                            navigate(`/properties/preview/${property._id}`)
                          }
                        />
                        <MenuBtn
                          icon={<Pencil size={13} />}
                          label="Edit"
                          color={property.status === "Rented" ? muted : deep}
                          hoverBg={hoverBg}
                          disabled={property.status === "Rented"}
                          onClick={() => {
                            if (property.status === "Rented") {
                              toast.info("Rented properties cannot be edited.");
                              return;
                            }
                            navigate(`/properties/${property._id}/edit`);
                          }}
                        />
                        {property.status === "Rented" && (
                          <MenuBtn
                            icon={<CircleCheck size={13} />}
                            label={
                              terminationRequestByPropertyId.has(property._id)
                                ? "Notice active"
                                : "Termination notice"
                            }
                            color={deep}
                            hoverBg={hoverBg}
                            onClick={() => {
                              setTerminationProperty({
                                id: property._id,
                                title: property.title,
                              });
                              setOpenMenuPropertyId(null);
                            }}
                          />
                        )}
                      </div>
                      <div style={{ height: 1, backgroundColor: border }} />
                      <div className="p-1">
                        <MenuBtn
                          icon={<Trash2 size={13} />}
                          label={
                            deletingPropertyId === property._id
                              ? "Deleting…"
                              : "Delete"
                          }
                          color="#dc2626"
                          hoverBg="rgba(220,38,38,0.07)"
                          disabled={deletingPropertyId === property._id}
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
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6">
        <PropertyPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <DeleteTerminationModal
        isOpen={terminationProperty !== null}
        propertyTitle={terminationProperty?.title ?? "this property"}
        isSubmitting={createTerminationRequest.isPending}
        onClose={() => setTerminationProperty(null)}
        onSendTerminationRequest={() => {
          if (!terminationProperty) return;
          void handleSendTerminationRequest(terminationProperty.id);
        }}
        isDark={isDark}
      />
    </>
  );
}

export default MyPropertyList;
