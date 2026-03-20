import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyDetailsView from "../../features/property/components/PropertyDetailsView";
import {
  useBrowserPropertyDetails,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";

function PropertyDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div
            className="h-72 animate-pulse rounded-2xl sm:col-span-2"
            style={{ backgroundColor: "#EDE8FD" }}
          />
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-22 animate-pulse rounded-xl"
                style={{ backgroundColor: "#EDE8FD" }}
              />
            ))}
          </div>
        </div>

        <div
          className="h-72 animate-pulse rounded-2xl border"
          style={{ backgroundColor: "#F1ECFF", borderColor: "#E7E1FA" }}
        />

        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="h-40 animate-pulse rounded-2xl border"
            style={{ backgroundColor: "#F1ECFF", borderColor: "#E7E1FA" }}
          />
        ))}
      </div>

      <aside>
        <div
          className="h-64 animate-pulse rounded-2xl border"
          style={{ backgroundColor: "#F1ECFF", borderColor: "#E7E1FA" }}
        />
      </aside>
    </div>
  );
}

function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: property, isLoading, isError } = useBrowserPropertyDetails(id);
  const { isPending, isRealUser } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleToggleFavorite = async (targetProperty: Property) => {
    if (isPending) return;

    if (!isRealUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsFavoriteLoading(true);

    try {
      if (targetProperty.isSaved) {
        await removeFavorite.mutateAsync({ propertyId: targetProperty._id });
      } else {
        await saveFavorite.mutateAsync({ propertyId: targetProperty._id });
      }
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <main className="pt-24">
      <LandingNavbar />

      <section className="px-4 py-8" style={{ backgroundColor: "#F7F5FF" }}>
        <div className="mx-auto max-w-6xl">
          <Link
            to="/properties"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            <ArrowLeft size={16} />
            Back to Listings
          </Link>

          {isLoading ? (
            <PropertyDetailsSkeleton />
          ) : isError || !property ? (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: "#E1D8FA", color: palette.purple }}
            >
              Couldn&apos;t load property details.
            </div>
          ) : (
            <PropertyDetailsView
              property={property}
              onToggleFavorite={handleToggleFavorite}
              isFavoriteLoading={isFavoriteLoading}
            />
          )}
        </div>
      </section>

      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default PropertyDetailsPage;
