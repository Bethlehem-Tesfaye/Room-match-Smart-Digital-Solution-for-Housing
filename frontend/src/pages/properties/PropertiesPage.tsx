import { useEffect, useState } from "react";
import LandingFooter from "../../features/landing/components/LandingFooter";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyListCard from "../../features/property/components/PropertyListCard";
import PropertyPagination from "../../features/property/components/PropertyPagination";
import {
  useBrowserProperties,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";

function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data, isLoading, isError } = useBrowserProperties({
    page,
    limit: 20,
  });
  const { isPending, isAuthenticated } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const [favoritePropertyId, setFavoritePropertyId] = useState<string | null>(
    null,
  );

  const properties = data?.properties ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    <main className="pt-24">
      <LandingNavbar />

      <section
        className="px-4 py-12 -mt-6"
        style={{ backgroundColor: palette.sectionBg }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              Browse Properties
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Browse for property that fits your budget, preferences, and
              lifestyle.
            </p>
          </div>

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
              Couldn&apos;t load properties right now.
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
                {properties.map((property) => (
                  <PropertyListCard
                    key={property._id}
                    property={property}
                    onToggleFavorite={handleToggleFavorite}
                    isFavoriteLoading={favoritePropertyId === property._id}
                  />
                ))}
              </div>

              <PropertyPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>

      <LandingFooter />

      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default PropertiesPage;
