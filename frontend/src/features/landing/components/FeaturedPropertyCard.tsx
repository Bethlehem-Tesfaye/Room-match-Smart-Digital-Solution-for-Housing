import { Bath, BedDouble, Heart, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../property/components/FavoriteAuthModal";
import {
  useRemoveFavorite,
  useSaveFavorite,
} from "../../property/hooks/usePropertyHooks";
import type { Property } from "../../property/types/type";
import { palette } from "../../../theme/palette";
import { Link } from "react-router-dom";

interface FeaturedPropertyCardProps {
  property: Property;
  onToggleFavorite?: (property: Property) => void;
}

const formatCurrency = (price: number, currency: string) => {
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  return `${currency} ${numberFormatter.format(price)}`;
};

function FeaturedPropertyCard({
  property,
  onToggleFavorite,
}: FeaturedPropertyCardProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFavoriteLoading] = useState(false);
  const { isPending, isAuthenticated } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const [isInternalFavoriteLoading, setIsInternalFavoriteLoading] =
    useState(false);
  const favoriteLoading = isFavoriteLoading || isInternalFavoriteLoading;

  const primaryImage =
    property.images.find((image) => image.isPrimary) ?? property.images[0];

  const handleFavoriteClick = async () => {
    if (favoriteLoading || isPending) return;

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (onToggleFavorite) {
      onToggleFavorite(property);
      return;
    }

    setIsInternalFavoriteLoading(true);

    try {
      if (property.isSaved) {
        await removeFavorite.mutateAsync({ propertyId: property._id });
      } else {
        await saveFavorite.mutateAsync({ propertyId: property._id });
      }
    } finally {
      setIsInternalFavoriteLoading(false);
    }
  };

  return (
    <>
      <Link to={`/properties/${property._id}`} className="block min-w-[280px]">
        <article
          className="group flex min-h-[320px] flex-col overflow-hidden rounded-xl border transition-transform duration-200 hover:-translate-y-0.5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="relative min-h-0 flex-[0.57] overflow-hidden"
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
                className="flex h-full min-h-[160px] items-center justify-center text-sm"
                style={{ color: palette.softPurple }}
              >
                No image
              </div>
            )}

            {property.status === "Active" ? (
              <span
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.88)",
                  color: "var(--palette-deep)",
                  border: `1px solid ${palette.border}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                Available
              </span>
            ) : null}
          </div>

          <div className="flex flex-[0.43] flex-col p-4">
            <h3
              className="line-clamp-1 text-sm font-bold"
              style={{ color: "var(--palette-deep)" }}
            >
              {property.title}
            </h3>

            <p
              className="mt-1 flex items-center gap-1 text-xs leading-relaxed"
              style={{ color: palette.softPurple }}
            >
              <MapPin size={12} />
              {property.city}
            </p>

            <div
              className="mt-2 flex items-center gap-3 text-[12px]"
              style={{ color: palette.softPurple }}
            >
              <span className="inline-flex items-center gap-1">
                <BedDouble size={12} />
                {property.numberOfBedrooms} beds
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath size={12} />
                {property.numberOfBathrooms} baths
              </span>
            </div>

            <div className="mt-auto flex items-center justify-between pt-3">
              <p
                className="text-base font-bold"
                style={{ color: palette.purple }}
              >
                {formatCurrency(property.price, property.currency)}
              </p>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
                aria-label={
                  property.isSaved ? "Remove from favorites" : "Save property"
                }
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleFavoriteClick();
                }}
                disabled={isFavoriteLoading}
              >
                {isFavoriteLoading ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                    style={{ color: palette.purple }}
                  />
                ) : (
                  <Heart
                    size={16}
                    fill={property.isSaved ? palette.purple : "transparent"}
                    style={{ color: palette.purple }}
                  />
                )}
              </button>
            </div>
          </div>
        </article>
      </Link>
      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

export default FeaturedPropertyCard;
