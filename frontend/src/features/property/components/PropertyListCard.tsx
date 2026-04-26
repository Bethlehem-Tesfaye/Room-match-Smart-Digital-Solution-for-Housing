import { Heart, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useRemoveFavorite, useSaveFavorite } from "../hooks/usePropertyHooks";
import { palette } from "../../../theme/palette";
import FavoriteAuthModal from "./FavoriteAuthModal";
import type { Property } from "../types/type";

interface PropertyListCardProps {
  property: Property;
  onToggleFavorite?: (property: Property) => void;
  isFavoriteLoading?: boolean;
}

const formatCurrency = (price: number, currency: string) => {
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  return `${currency} ${numberFormatter.format(price)}`;
};

function PropertyListCard({
  property,
  onToggleFavorite,
  isFavoriteLoading = false,
}: PropertyListCardProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInternalFavoriteLoading, setIsInternalFavoriteLoading] =
    useState(false);
  const { isPending, isAuthenticated } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();

  const primaryImage =
    property.images.find((image) => image.isPrimary) ?? property.images[0];

  const favoriteLoading = isFavoriteLoading || isInternalFavoriteLoading;
  const isRented = property.status === "Rented";

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
      <Link to={`/properties/${property._id}`} className="block">
        <article
          className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
            isRented ? "opacity-70 saturate-0" : ""
          }`}
          style={{ borderColor: palette.border }}
        >
          <div
            className="relative h-48 w-full overflow-hidden"
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

            {isRented ? (
              <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold tracking-wide text-white">
                RENTED
              </span>
            ) : null}

            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
              aria-label={
                property.isSaved ? "Remove from favorites" : "Save property"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleFavoriteClick();
              }}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                  style={{ color: palette.purple }}
                />
              ) : (
                <Heart
                  size={15}
                  fill={property.isSaved ? palette.purple : "transparent"}
                  style={{ color: palette.purple }}
                />
              )}
            </button>
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
                {formatCurrency(property.price, property.currency)}
              </p>
              <p className="text-xs" style={{ color: palette.softPurple }}>
                {property.numberOfBedrooms} bd | {property.numberOfBathrooms} ba
              </p>
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

export default PropertyListCard;
