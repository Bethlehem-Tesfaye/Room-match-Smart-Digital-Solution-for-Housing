import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyDetailsView, {
  PropertyDetailsSkeleton,
} from "../../features/property/components/PropertyDetailsView";
import {
  useBrowserPropertyDetails,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";

function PropertyPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    data: property,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useBrowserPropertyDetails(id);
  const { isPending, isAuthenticated } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleToggleFavorite = async (targetProperty: Property) => {
    if (isPending) return;

    if (!isAuthenticated) {
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
    <main style={{ backgroundColor: palette.pageBg }}>
      <DashboardNavbar activeTab={"dashboard"} />

      <section className="flex-1 px-4 py-10 pt-24">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard/my-properties"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            <ArrowLeft size={16} />
            Back to listings
          </Link>
          <p
            className="mb-6 text-2xl font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            See what potential tenants see
          </p>

          {isLoading ? (
            <PropertyDetailsSkeleton />
          ) : isError ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
              <RefreshCw
                size={64}
                className="mb-5"
                style={{ color: palette.softPurple }}
              />
              <p
                className="text-xl font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                Couldn&apos;t load this listing
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-6 min-h-11 rounded-lg px-6 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: palette.purple }}
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : !property ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
              <Home
                size={64}
                className="mb-5"
                style={{ color: palette.softPurple }}
              />
              <p
                className="text-xl font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                This listing isn&apos;t available
              </p>
              <Link
                to="/dashboard/my-properties"
                className="mt-6 inline-flex min-h-11 items-center rounded-lg px-6 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: palette.purple }}
              >
                Back to my properties
              </Link>
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

export default PropertyPreviewPage;
