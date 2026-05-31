import { Link } from "react-router-dom";
import { useState } from "react";
import type { Property } from "../../property/types/type";
import { palette } from "../../../theme/palette";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import {
  useRemoveFavorite,
  useSaveFavorite,
} from "../../property/hooks/usePropertyHooks";

interface LandingFeaturedPropertiesProps {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
}

function LandingFeaturedProperties({
  properties,
  isLoading,
  isError,
}: LandingFeaturedPropertiesProps) {
  const [, setIsAuthModalOpen] = useState(false);

  const { isPending, isAuthenticated } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const [, setFavoritePropertyId] = useState<string | null>(null);
  const handleToggleFavorite = async (property: Property) => {
    if (isPending) return;

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setFavoritePropertyId(property._id);

    try {
      if (property.isSaved) {
        await removeFavorite.mutateAsync({ propertyId: property._id });
      } else {
        await saveFavorite.mutateAsync({ propertyId: property._id });
      }
    } finally {
      setFavoritePropertyId(null);
    }
  };

  return (
    <section className="px-4 py-16" style={{ backgroundColor: palette.pageBg }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              className="font-serif text-3xl font-bold"
              style={{ color: "var(--palette-deep)" }}
            >
              Featured listings
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: palette.softPurple }}
            >
              Hand-picked properties in top neighborhoods
            </p>
          </div>
          <Link
            to="/properties"
            className="shrink-0 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ color: palette.purple }}
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="skeleton min-h-[320px] min-w-[280px] rounded-xl"
              />
            ))}
          </div>
        ) : isError ? (
          <div
            className="mt-8 rounded-xl border p-6 text-sm"
            style={{ borderColor: palette.border, color: palette.purple }}
          >
            Couldn&apos;t load featured properties right now.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {properties.slice(0, 4).map((property) => (
              <FeaturedPropertyCard
                key={property._id}
                property={property}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingFeaturedProperties;
