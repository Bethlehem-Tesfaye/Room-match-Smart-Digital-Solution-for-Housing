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
    <main className="flex min-h-screen flex-col pt-24">
      <LandingNavbar />
      <div
        className="-mt-6 flex-1 px-4 py-12"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
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
      </div>
    </main>
  );
}

export default SavedPropertiesPage;
