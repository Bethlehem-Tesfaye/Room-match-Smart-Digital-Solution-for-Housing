import {
  Bath,
  Bed,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Maximize,
  Sofa,
  Banknote,
  Heart,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { palette } from "../../../theme/palette";
import type { Property } from "../types/type";

interface PropertyDetailsViewProps {
  property: Property;
  onToggleFavorite?: (property: Property) => void;
  isFavoriteLoading?: boolean;
  onSendMessage?: (payload: { content: string }) => Promise<void>;
  isSendMessageLoading?: boolean;
}

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

function PropertyDetailsView({
  property,
  onToggleFavorite,
  isFavoriteLoading = false,
  onSendMessage,
  isSendMessageLoading = false,
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

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [messageDraft, setMessageDraft] = useState("");

  const totalImages = orderedImages.length;

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  const detailItems = [
    {
      label: "Deposit",
      value: formatCurrency(property.deposit, property.currency),
      icon: Banknote,
    },
    {
      label: "Initial Payment",
      value: formatCurrency(property.initialPayment, property.currency),
      icon: Banknote,
    },
    {
      label: "Lease Period",
      value: `${property.leasePeriod} months`,
      icon: CalendarDays,
    },
    {
      label: "Furnished",
      value: property.isFurnished ? "Yes" : "No",
      icon: Sofa,
    },
    {
      label: "Floor",
      value: property.floorNumber?.toString() ?? "Not specified",
      icon: Building2,
    },
    {
      label: "Total Floors",
      value: property.totalFloors?.toString() ?? "Not specified",
      icon: Layers,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        {orderedImages.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="group relative overflow-hidden rounded-2xl sm:col-span-2"
              style={{ backgroundColor: palette.cardMutedBg }}
            >
              <img
                src={orderedImages[0].imageUrl}
                alt={property.title}
                className="h-72 w-full object-cover"
              />
              <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                <Maximize size={16} />
              </span>
            </button>

            <div className="grid gap-2">
              {orderedImages.slice(1, 4).map((image, index) => (
                <button
                  key={image._id}
                  type="button"
                  onClick={() => openLightbox(index + 1)}
                  className="overflow-hidden rounded-xl"
                  style={{ backgroundColor: palette.cardMutedBg }}
                >
                  <img
                    src={image.imageUrl}
                    alt={`${property.title} ${index + 2}`}
                    className="h-22 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex h-72 items-center justify-center rounded-2xl border text-sm"
            style={{
              borderColor: palette.skeleton,
              color: palette.softPurple,
            }}
          >
            No images available
          </div>
        )}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: palette.chipBg, color: palette.purple }}
            >
              {property.propertyType}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: palette.chipBg, color: palette.purple }}
            >
              {property.isFurnished ? "Furnished" : "Unfurnished"}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: palette.chipBg, color: palette.purple }}
            >
              {property.status}
            </span>
            {isUnavailable ? (
              <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                {property.status.toUpperCase()}
              </span>
            ) : null}
          </div>

          <h1
            className="mt-3 text-3xl font-extrabold"
            style={{ color: palette.deep }}
          >
            {property.title}
          </h1>

          <p
            className="mt-2 flex items-center gap-1 text-sm"
            style={{ color: palette.purple }}
          >
            <MapPin size={14} />
            {property.address}, {property.city}
          </p>

          <p
            className="mt-4 text-4xl font-extrabold"
            style={{ color: palette.purple }}
          >
            {formatCurrency(property.price, property.currency)}
            <span
              className="ml-1 text-base font-semibold"
              style={{ color: palette.softPurple }}
            >
              /month
            </span>
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: palette.border }}
            >
              <Bed size={16} style={{ color: palette.purple }} />
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: palette.deep }}
              >
                {property.numberOfBedrooms}
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Bedrooms
              </p>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: palette.border }}
            >
              <Bath size={16} style={{ color: palette.purple }} />
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: palette.deep }}
              >
                {property.numberOfBathrooms}
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Bathrooms
              </p>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: palette.border }}
            >
              <Maximize size={16} style={{ color: palette.purple }} />
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: palette.deep }}
              >
                {property.areaSqFt ?? "—"}
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Sq. Ft.
              </p>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: palette.border }}
            >
              <CalendarDays size={16} style={{ color: palette.purple }} />
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: palette.deep }}
              >
                {formatDate(property.availableFrom)}
              </p>
              <p className="text-sm" style={{ color: palette.softPurple }}>
                Available
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: palette.deep }}>
            About This Property
          </h2>
          <p className="mt-3 text-sm" style={{ color: palette.purple }}>
            {property.description || "No description provided."}
          </p>
        </div>

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: palette.deep }}>
            Property Details
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {detailItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: palette.chipBg,
                      color: palette.deep,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div>
                    <p
                      className="text-sm"
                      style={{ color: palette.softPurple }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-md font-semibold leading-tight"
                      style={{ color: palette.deep }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: palette.deep }}>
            Amenities
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {(property.amenities?.length ?? 0) > 0 ? (
              property.amenities?.map((amenity) => (
                <span
                  key={amenity._id}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: palette.chipBg,
                    color: palette.purple,
                  }}
                >
                  {amenity.name}
                </span>
              ))
            ) : property.amenityIds.length > 0 ? (
              property.amenityIds.map((amenityId) => (
                <span
                  key={amenityId}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: palette.chipBg,
                    color: palette.purple,
                  }}
                >
                  {amenityId}
                </span>
              ))
            ) : (
              <p className="text-sm" style={{ color: palette.softPurple }}>
                No amenities listed.
              </p>
            )}
          </div>
        </div>
      </div>

      <aside>
        <div
          className="rounded-2xl border bg-white p-5 lg:sticky lg:top-4"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: palette.border, color: palette.deep }}
            onClick={() => onToggleFavorite?.(property)}
            disabled={isFavoriteLoading}
          >
            <Heart
              size={16}
              fill={property.isSaved ? palette.purple : "transparent"}
              style={{ color: palette.purple }}
            />
            {property.isSaved ? "Remove Favorite" : "Save Favorite"}
          </button>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: palette.purple }}
          >
            {property.owner?.name || "Unknown owner"}
          </p>
          <p
            className="mt-1 break-all text-xs"
            style={{ color: palette.softPurple }}
          >
            property owner
          </p>

          <textarea
            className="mt-4 min-h-28 w-full rounded-xl border p-3 text-sm outline-none"
            style={{
              borderColor: palette.border,
              color: palette.deep,
              backgroundColor: palette.inputBg,
            }}
            placeholder={`Hi, I'm interested in "${property.title}". Is it still available?`}
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            disabled={isUnavailable || isSendMessageLoading}
          />

          {isUnavailable ? (
            <button
              type="button"
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white opacity-80"
              style={{ backgroundColor: "#9CA3AF" }}
              onClick={handleSendMessage}
              disabled
            >
              Unavailable
            </button>
          ) : (
            <button
              type="button"
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: palette.softPurple }}
              onClick={handleSendMessage}
              disabled={isSendMessageLoading}
            >
              {isSendMessageLoading ? "Sending..." : "Send Message"}
            </button>
          )}
        </div>
      </aside>

      {isLightboxOpen && currentImage ? (
        <div
          className="fixed inset-0 z-501 bg-black/75 px-4 py-6"
          onClick={closeLightbox}
        >
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            <div
              className="relative h-full w-full rounded-2xl border bg-black"
              style={{ borderColor: palette.border }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-black/50 text-white"
                style={{ borderColor: "#FFFFFF" }}
                aria-label="Close image preview"
              >
                <X size={20} />
              </button>

              <button
                type="button"
                onClick={goToPreviousImage}
                className="absolute left-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>

              <img
                src={currentImage.imageUrl}
                alt={`${property.title} image ${activeImageIndex + 1}`}
                className="h-full w-full object-contain"
              />

              <button
                type="button"
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>

              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
                {activeImageIndex + 1} / {totalImages}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PropertyDetailsView;
