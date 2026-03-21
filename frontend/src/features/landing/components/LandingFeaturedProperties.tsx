import type { Property } from "../../property/types/type";
import { palette } from "../../../theme/palette";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import {
  useRemoveFavorite,
  useSaveFavorite,
} from "../../property/hooks/usePropertyHooks";
import { useState } from "react";
import { motion } from "framer-motion";

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              Featured Properties
            </h2>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Discover top-rated rentals in your area
            </p>
          </div>
          <Link to="/properties">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 cursor-pointer text-sm font-semibold"
              style={{
                borderColor: palette.lightPurple,
                color: palette.pageBg,
                backgroundColor: palette.purple,
              }}
            >
              View All
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div
            className="mt-8 rounded-2xl border p-6 text-sm"
            style={{ borderColor: palette.border, color: palette.purple }}
          >
            Couldn&apos;t load featured properties right now.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property, idx) => (
              <motion.div
                key={property._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <FeaturedPropertyCard
                  property={property}
                  onToggleFavorite={handleToggleFavorite}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingFeaturedProperties;
