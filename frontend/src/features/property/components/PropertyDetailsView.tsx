import {
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  RefreshCw,
  Ruler,
  Flag,
  Share2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { palette } from "../../../theme/palette";
import PropertyListCard from "./PropertyListCard";
import { useBrowserProperties } from "../hooks/usePropertyHooks";
import type { Property, PropertyStatus } from "../types/type";

interface PropertyDetailsViewProps {
  property: Property;
  onToggleFavorite?: (property: Property) => void;
  isFavoriteLoading?: boolean;
  onSendMessage?: (payload: { content: string }) => Promise<void>;
  isSendMessageLoading?: boolean;
  onReportListing?: () => void;
  showReportListing?: boolean;
}

const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.07)";

const formatCurrency = (price: number, currency: string) => {
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  return `${currency} ${numberFormatter.format(price)}`;
};

const formatDate = (dateValue: string | null) => {
  if (!dateValue) return "Not specified";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatPropertyType = (type: Property["propertyType"]) =>
  type === "SharedRoom" ? "Shared room" : type;

const getStatusDisplay = (status: PropertyStatus) => {
  switch (status) {
    case "Active":
      return { label: "Available", dot: "#22c55e" };
    case "Rented":
      return { label: "Rented", dot: "#ef4444" };
    case "Reserved":
      return { label: "Pending", dot: "#f59e0b" };
    default:
      return { label: status, dot: palette.softPurple };
  }
};

function HairlineDivider() {
  return (
    <div
      className="h-px w-full"
      style={{ backgroundColor: palette.border, opacity: 0.5 }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[11px] font-bold uppercase tracking-widest"
      style={{ color: palette.softPurple }}
    >
      {children}
    </p>
  );
}

export function PropertyDetailsSkeleton() {
  return (
    <div className="lg:flex lg:gap-10">
      <div className="min-w-0 flex-1 space-y-8">
        <div className="hidden h-120 gap-2 md:grid md:grid-cols-5">
          <div className="skeleton col-span-3 rounded-xl" />
          <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton rounded-xl" />
            ))}
          </div>
        </div>
        <div className="skeleton h-56 rounded-2xl md:hidden" />

        <div className="space-y-3">
          <div className="skeleton h-8 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
          <div className="skeleton h-4 w-2/3 rounded-lg" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton h-8 w-28 rounded-lg" />
          ))}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="skeleton h-4 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <aside className="hidden w-[320px] shrink-0 lg:block">
        <div className="skeleton h-90 rounded-xl" />
      </aside>
    </div>
  );
}

function PropertyDetailsView({
  property,
  onToggleFavorite,
  isFavoriteLoading = false,
  onSendMessage,
  isSendMessageLoading = false,
  onReportListing,
  showReportListing = false,
}: PropertyDetailsViewProps) {
  const isUnavailable = property.status !== "Active";
  const orderedImages = useMemo(() => {
    if (!property.images.length) return [];

    const primaryImage = property.images.find((image) => image.isPrimary);
    if (!primaryImage) return property.images;

    return [
      primaryImage,
      ...property.images.filter((image) => image._id !== primaryImage._id),
    ];
  }, [property.images]);

  const gallerySlots = useMemo(() => {
    return Array.from(
      { length: 5 },
      (_, index) => orderedImages[index] ?? null,
    );
  }, [orderedImages]);

  const amenityItems = useMemo(() => {
    if (property.amenities?.length) return property.amenities;
    return property.amenityIds.map((id) => ({
      _id: id,
      name: id,
      category: "",
    }));
  }, [property.amenities, property.amenityIds]);

  const { data: similarData } = useBrowserProperties({
    page: 1,
    limit: 8,
    propertyType: property.propertyType,
    search: property.city,
  });

  const similarProperties = useMemo(
    () =>
      (similarData?.properties ?? [])
        .filter((item) => item._id !== property._id)
        .slice(0, 4),
    [similarData?.properties, property._id],
  );

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [messageDraft, setMessageDraft] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);
  const [mobileDotIndex, setMobileDotIndex] = useState(0);
  const mobileGalleryRef = useRef<HTMLDivElement | null>(null);

  const totalImages = orderedImages.length;
  const statusDisplay = getStatusDisplay(property.status);
  const ownerName = property.owner?.name || "Unknown host";
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const memberSinceYear = new Date(property.createdAt).getFullYear();
  const availabilityLabel =
    property.status === "Active"
      ? property.availableFrom
        ? `Available ${formatDate(property.availableFrom)}`
        : "Available now"
      : statusDisplay.label;

  const detailItems = [
    {
      label: "Initial payment",
      value: formatCurrency(property.initialPayment, property.currency),
    },
    {
      label: "Lease period",
      value: `${property.leasePeriod} months`,
    },
    {
      label: "Furnished",
      value: property.isFurnished ? "Yes" : "No",
    },
    {
      label: "Floor",
      value: property.floorNumber?.toString() ?? "Not specified",
    },
    {
      label: "Total floors",
      value: property.totalFloors?.toString() ?? "Not specified",
    },
  ];

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const goToPreviousImage = () => {
    setActiveImageIndex((current) => {
      if (totalImages <= 1) return current;
      return current === 0 ? totalImages - 1 : current - 1;
    });
  };

  const goToNextImage = () => {
    setActiveImageIndex((current) => {
      if (totalImages <= 1) return current;
      return current === totalImages - 1 ? 0 : current + 1;
    });
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") goToPreviousImage();
      if (event.key === "ArrowRight") goToNextImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, totalImages]);

  const currentImage = orderedImages[activeImageIndex];

  const handleSendMessage = async () => {
    if (isUnavailable) {
      toast.error("This property is no longer available.");
      return;
    }

    const trimmedMessage = messageDraft.trim();

    if (!trimmedMessage) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!onSendMessage) {
      toast.error("Messaging is not available");
      return;
    }

    try {
      await onSendMessage({ content: trimmedMessage });
      setMessageDraft("");
      setIsMessageExpanded(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not share this listing");
    }
  };

  const handleMobileGalleryScroll = () => {
    const container = mobileGalleryRef.current;
    if (!container || orderedImages.length === 0) return;

    const slideWidth = container.clientWidth * 0.85 + 12;
    const index = Math.round(container.scrollLeft / slideWidth);
    setMobileDotIndex(Math.min(index, orderedImages.length - 1));
  };

  const renderGalleryCell = (
    slot: (typeof gallerySlots)[number],
    index: number,
    className: string,
  ) => {
    if (slot) {
      return (
        <button
          key={slot._id}
          type="button"
          onClick={() => openLightbox(index)}
          className={`relative overflow-hidden ${className}`}
          style={{ backgroundColor: palette.cardMutedBg }}
        >
          <img
            src={slot.imageUrl}
            alt={`${property.title} ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </button>
      );
    }

    return (
      <div
        key={`placeholder-${index}`}
        className={className}
        style={{ backgroundColor: palette.cardMutedBg }}
      />
    );
  };

  const renderContactCard = (options?: {
    className?: string;
    sticky?: boolean;
  }) => (
    <div
      className={`rounded-xl border p-5 ${options?.sticky ? "lg:sticky lg:top-24" : ""} ${options?.className ?? ""}`}
      style={{
        borderColor: palette.border,
        backgroundColor: palette.cardBg,
        boxShadow: CARD_SHADOW,
      }}
    >
      <p className="text-[22px] font-bold" style={{ color: palette.purple }}>
        {formatCurrency(property.price, property.currency)}
        <span
          className="ml-1 text-sm font-normal"
          style={{ color: palette.softPurple }}
        >
          / month
        </span>
      </p>
      <p
        className="mt-1 text-[13px] leading-relaxed"
        style={{ color: palette.softPurple }}
      >
        + utilities · {availabilityLabel}
      </p>

      <div
        className="my-5 h-px w-full"
        style={{ backgroundColor: palette.border, opacity: 0.5 }}
      />

      {isUnavailable ? (
        <button
          type="button"
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white opacity-80"
          style={{ backgroundColor: palette.softPurple }}
          disabled
        >
          Unavailable
        </button>
      ) : (
        <button
          type="button"
          className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: palette.purple }}
          onClick={() => setIsMessageExpanded((previous) => !previous)}
          disabled={!onSendMessage}
        >
          Message landlord
        </button>
      )}

      {isMessageExpanded && onSendMessage ? (
        <div className="mt-4 space-y-3">
          <textarea
            className="min-h-28 w-full rounded-lg border p-3 text-sm outline-none"
            style={{
              borderColor: palette.border,
              color: "var(--app-text)",
              backgroundColor: palette.inputBg,
            }}
            placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            disabled={isSendMessageLoading || isUnavailable}
          />
          <button
            type="button"
            className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: palette.purple }}
            onClick={() => void handleSendMessage()}
            disabled={isSendMessageLoading || isUnavailable}
          >
            {isSendMessageLoading ? "Sending..." : "Send message"}
          </button>
        </div>
      ) : null}

      <div
        className="my-5 h-px w-full"
        style={{ backgroundColor: palette.border, opacity: 0.5 }}
      />

      <p
        className="flex items-center gap-2 text-[12px]"
        style={{ color: palette.softPurple }}
      >
        <Check size={14} style={{ color: palette.purple }} />
        Free to enquire
      </p>
    </div>
  );

  const lightboxPortal =
    isLightboxOpen && currentImage
      ? createPortal(
          <div
            className="fixed inset-0 z-600 flex items-center justify-center px-4 py-6"
            style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
            onClick={closeLightbox}
          >
            <div
              className="relative mx-auto h-full w-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-0 top-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg text-white"
                aria-label="Close image preview"
              >
                <X size={22} />
              </button>

              {totalImages > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              ) : null}

              <img
                src={currentImage.imageUrl}
                alt={`${property.title} image ${activeImageIndex + 1}`}
                className="mx-auto h-full max-h-[85vh] w-full object-contain"
              />

              <p
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-white"
                style={{ opacity: 0.9 }}
              >
                {activeImageIndex + 1} / {totalImages}
              </p>
            </div>
          </div>,
          document.body,
        )
      : null;

  const amenitiesModalPortal = isAmenitiesModalOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-600 flex items-end justify-center px-4 py-6 sm:items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setIsAmenitiesModalOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6"
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.border,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-lg font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                All amenities
              </h3>
              <button
                type="button"
                onClick={() => setIsAmenitiesModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center"
                aria-label="Close amenities"
              >
                <X size={20} style={{ color: palette.softPurple }} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {amenityItems.map((amenity) => (
                <div
                  key={amenity._id}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--app-text)" }}
                >
                  <Check size={16} style={{ color: palette.purple }} />
                  {amenity.name}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const mobileBarPortal =
    !isUnavailable && onSendMessage
      ? createPortal(
          <>
            {isMessageExpanded ? (
              <div
                className="fixed inset-0 z-55 md:hidden"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                onClick={() => setIsMessageExpanded(false)}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-xl border-t p-5"
                  style={{
                    backgroundColor: palette.cardBg,
                    borderColor: palette.border,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <textarea
                    className="min-h-28 w-full rounded-lg border p-3 text-sm outline-none"
                    style={{
                      borderColor: palette.border,
                      color: "var(--app-text)",
                      backgroundColor: palette.inputBg,
                    }}
                    placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    disabled={isSendMessageLoading}
                  />
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg px-4 py-3 text-sm font-bold text-white"
                    style={{ backgroundColor: palette.purple }}
                    onClick={() => void handleSendMessage()}
                    disabled={isSendMessageLoading}
                  >
                    {isSendMessageLoading ? "Sending..." : "Send message"}
                  </button>
                </div>
              </div>
            ) : null}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 md:hidden"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                boxShadow: CARD_SHADOW,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: palette.purple }}
                  >
                    {formatCurrency(property.price, property.currency)}
                  </p>
                  <p className="text-xs" style={{ color: palette.softPurple }}>
                    / month
                  </p>
                </div>
                <button
                  type="button"
                  className="min-h-11 rounded-xl px-6 py-2.5 text-sm font-bold text-white"
                  style={{ backgroundColor: palette.purple }}
                  onClick={() => setIsMessageExpanded(true)}
                  disabled={isSendMessageLoading}
                >
                  Contact
                </button>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="pb-24 md:pb-0 lg:flex lg:gap-10">
        <div className="min-w-0 flex-1 space-y-8">
          <div className="relative hidden md:block">
            {totalImages > 0 ? (
              <div className="grid h-120 grid-cols-5 gap-2">
                {renderGalleryCell(
                  gallerySlots[0],
                  0,
                  "col-span-3 h-full rounded-xl",
                )}
                <div className="col-span-2 grid h-full grid-cols-2 grid-rows-2 gap-2">
                  {gallerySlots
                    .slice(1)
                    .map((slot, index) =>
                      renderGalleryCell(slot, index + 1, "h-full rounded-xl"),
                    )}
                </div>
              </div>
            ) : (
              <div
                className="flex min-h-60 items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center md:min-h-120"
                style={{
                  backgroundColor: palette.cardMutedBg,
                  borderColor: palette.border,
                }}
              >
                <div className="max-w-sm space-y-2">
                  <Building2 size={28} style={{ color: palette.softPurple }} />
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--palette-deep)" }}
                  >
                    No images available
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: palette.softPurple }}
                  >
                    The owner has not uploaded any photos for this listing yet.
                  </p>
                </div>
              </div>
            )}
            {totalImages > 0 ? (
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="absolute bottom-4 right-4 rounded-lg border px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.cardBg,
                  color: "var(--palette-deep)",
                  boxShadow: CARD_SHADOW,
                }}
              >
                Show all photos
              </button>
            ) : null}
          </div>

          <div className="md:hidden">
            {totalImages > 0 ? (
              <div className="relative">
                <div
                  ref={mobileGalleryRef}
                  className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
                  onScroll={handleMobileGalleryScroll}
                >
                  {orderedImages.map((image, index) => (
                    <button
                      key={image._id}
                      type="button"
                      onClick={() => openLightbox(index)}
                      className="h-56 w-[85vw] shrink-0 snap-center overflow-hidden rounded-2xl"
                      style={{ backgroundColor: palette.cardMutedBg }}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`${property.title} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {orderedImages.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-1.5">
                    {orderedImages.map((image, index) => (
                      <span
                        key={image._id}
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: mobileDotIndex === index ? 16 : 6,
                          backgroundColor:
                            mobileDotIndex === index
                              ? palette.purple
                              : palette.border,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="flex min-h-60 items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center md:min-h-120"
                style={{
                  backgroundColor: palette.cardMutedBg,
                  borderColor: palette.border,
                }}
              >
                <div className="max-w-sm space-y-2">
                  <Building2 size={28} style={{ color: palette.softPurple }} />
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--palette-deep)" }}
                  >
                    No images available
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: palette.softPurple }}
                  >
                    The owner has not uploaded any photos for this listing yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between gap-4 md:flex">
            <nav
              className="flex flex-wrap items-center gap-1 text-[12px]"
              style={{ color: palette.softPurple }}
              aria-label="Breadcrumb"
            >
              <Link to="/" className="transition-opacity hover:opacity-80">
                Home
              </Link>
              <ChevronRight size={12} />
              <Link
                to="/properties"
                className="transition-opacity hover:opacity-80"
              >
                Properties
              </Link>
              <ChevronRight size={12} />
              <span
                className="line-clamp-1"
                style={{ color: "var(--app-text)" }}
              >
                {property.title}
              </span>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-opacity hover:opacity-80"
                style={{
                  borderColor: palette.border,
                  color: "var(--palette-deep)",
                }}
                aria-label="Share listing"
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite?.(property)}
                disabled={isFavoriteLoading}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ borderColor: palette.border, color: palette.purple }}
                aria-label={
                  property.isSaved ? "Remove from favorites" : "Save property"
                }
              >
                {isFavoriteLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Heart
                    size={18}
                    fill={property.isSaved ? palette.purple : "transparent"}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 md:hidden">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] backdrop-blur-sm"
                  style={{
                    backgroundColor: palette.chipBg,
                    color: "var(--palette-deep)",
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusDisplay.dot }}
                  />
                  {statusDisplay.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border"
                style={{
                  borderColor: palette.border,
                  color: "var(--palette-deep)",
                }}
                aria-label="Share listing"
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite?.(property)}
                disabled={isFavoriteLoading}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border disabled:opacity-60"
                style={{ borderColor: palette.border, color: palette.purple }}
                aria-label={
                  property.isSaved ? "Remove from favorites" : "Save property"
                }
              >
                {isFavoriteLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Heart
                    size={18}
                    fill={property.isSaved ? palette.purple : "transparent"}
                  />
                )}
              </button>
            </div>
          </div>

          <section>
            <h1
              className="text-2xl font-bold md:truncate md:text-3xl"
              style={{ color: "var(--palette-deep)" }}
            >
              {property.title}
            </h1>

            <div className="mt-3 hidden flex-wrap items-center gap-3 md:flex">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                style={{
                  backgroundColor: palette.chipBg,
                  color: "var(--palette-deep)",
                  border: `1px solid ${palette.border}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusDisplay.dot }}
                />
                {statusDisplay.label}
              </span>
            </div>

            <p
              className="mt-3 flex items-start gap-1.5 text-sm leading-relaxed"
              style={{ color: palette.softPurple }}
            >
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {property.address}, {property.city}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                {
                  icon: BedDouble,
                  label: `${property.numberOfBedrooms} bedroom${property.numberOfBedrooms === 1 ? "" : "s"}`,
                },
                {
                  icon: Bath,
                  label: `${property.numberOfBathrooms} bathroom${property.numberOfBathrooms === 1 ? "" : "s"}`,
                },
                ...(property.areaSqFt
                  ? [{ icon: Ruler, label: `${property.areaSqFt} sq ft` }]
                  : []),
                {
                  icon: Building2,
                  label: formatPropertyType(property.propertyType),
                },
                {
                  icon: Users,
                  label: property.allowRoommates
                    ? "Roommates allowed"
                    : "Roommates not allowed",
                },
              ].map((chip) => {
                const Icon = chip.icon;
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px]"
                    style={{
                      backgroundColor: palette.chipBg,
                      color: "var(--palette-deep)",
                    }}
                  >
                    <Icon size={14} style={{ color: palette.softPurple }} />
                    {chip.label}
                  </span>
                );
              })}
            </div>
          </section>

          <div className="md:block lg:hidden">
            {renderContactCard()}
            <button
              type="button"
              className="mt-3 flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-80"
              style={{ color: palette.softPurple }}
            >
              {/* <Flag size={12} />
              Report this listing */}
            </button>
          </div>

          <HairlineDivider />

          <section className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {property.owner?.image ? (
                <img
                  src={property.owner.image}
                  alt={ownerName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: palette.chipBg,
                    color: palette.purple,
                  }}
                >
                  {ownerInitial}
                </span>
              )}
              <div>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--palette-deep)" }}
                >
                  Hosted by {ownerName}
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: palette.softPurple }}
                >
                  Member since {memberSinceYear}
                </p>
              </div>
            </div>
          </section>

          <HairlineDivider />

          <section>
            <SectionLabel>About this property</SectionLabel>
            <p
              className={`text-[15px] leading-[1.8] ${showFullDescription ? "" : "line-clamp-4"}`}
              style={{ color: "var(--app-text)" }}
            >
              {property.description || "No description provided."}
            </p>
            {(property.description?.length ?? 0) > 220 ? (
              <button
                type="button"
                onClick={() => setShowFullDescription((previous) => !previous)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-80"
                style={{ color: palette.purple }}
              >
                {showFullDescription ? "Show less" : "Show more"}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showFullDescription ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </section>

          <HairlineDivider />

          <section>
            <SectionLabel>Listing details</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {detailItems.map((item) => (
                <div key={item.label}>
                  <p
                    className="text-[12px]"
                    style={{ color: palette.softPurple }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="mt-0.5 text-sm"
                    style={{ color: "var(--app-text)" }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <HairlineDivider />

          <section>
            <SectionLabel>What this place offers</SectionLabel>
            {amenityItems.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {amenityItems.slice(0, 8).map((amenity) => (
                    <div
                      key={amenity._id}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--app-text)" }}
                    >
                      <Check size={16} style={{ color: palette.purple }} />
                      {amenity.name}
                    </div>
                  ))}
                </div>
                {amenityItems.length > 8 ? (
                  <button
                    type="button"
                    onClick={() => setIsAmenitiesModalOpen(true)}
                    className="mt-4 rounded-lg border px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
                    style={{
                      borderColor: palette.border,
                      color: "var(--palette-deep)",
                    }}
                  >
                    Show all {amenityItems.length} amenities
                  </button>
                ) : null}
              </>
            ) : (
              <p className="text-sm" style={{ color: palette.softPurple }}>
                No amenities listed.
              </p>
            )}
          </section>

          {similarProperties.length > 0 ? (
            <>
              <HairlineDivider />
              <section>
                <SectionLabel>Similar listings</SectionLabel>
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
                  {similarProperties.map((similarProperty) => (
                    <div
                      key={similarProperty._id}
                      className="w-70 shrink-0 lg:w-auto"
                    >
                      <PropertyListCard property={similarProperty} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>

        <aside className="hidden w-[320px] shrink-0 lg:block">
          {renderContactCard({ sticky: true })}
          {showReportListing && onReportListing ? (
            <button
              type="button"
              onClick={onReportListing}
              className="mt-3 flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-80"
              style={{ color: palette.softPurple }}
            >
              <Flag size={12} />
              Report listing
            </button>
          ) : null}
        </aside>
      </div>

      {lightboxPortal}
      {amenitiesModalPortal}
      {mobileBarPortal}
    </>
  );
}

export default PropertyDetailsView;
