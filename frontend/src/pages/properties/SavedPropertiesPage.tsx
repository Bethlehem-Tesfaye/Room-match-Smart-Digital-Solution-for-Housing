import { useEffect, useState } from "react";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import SavedPropertiesSection from "../../features/property/components/SavedPropertiesSection";
import {
  useRemoveFavorite,
  useSavedProperties,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";

function SavedPropertiesPage() {
  const [page, setPage] = useState(1);
  const [favoritePropertyId, setFavoritePropertyId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError } = useSavedProperties({
    page,
    limit: 20,
  });
  const removeFavorite = useRemoveFavorite();

  const properties = data?.properties ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleToggleFavorite = async (property: Property) => {
    setFavoritePropertyId(property._id);

    try {
      await removeFavorite.mutateAsync({ propertyId: property._id });
    } finally {
      setFavoritePropertyId(null);
    }
  };

  return (
    <main className="pt-24">
      <LandingNavbar />

      <section
        className="px-4 py-12 -mt-6"
        style={{ backgroundColor: "#F7F5FF" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              Saved Properties
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Your favorite listings, saved for quick access.
            </p>
          </div>

          <SavedPropertiesSection
            properties={properties}
            isLoading={isLoading}
            isError={isError}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onToggleFavorite={handleToggleFavorite}
            favoritePropertyId={favoritePropertyId}
          />
        </div>
      </section>
    </main>
  );
}

export default SavedPropertiesPage;
