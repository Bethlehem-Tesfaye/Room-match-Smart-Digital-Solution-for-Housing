import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyDetailsView from "../../features/property/components/PropertyDetailsView";
import {
  useBrowserPropertyDetails,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";

function PropertyDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="skeleton h-72 rounded-2xl sm:col-span-2" />
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="skeleton h-22 rounded-xl" />
            ))}
          </div>
        </div>

        <div
          className="skeleton h-72 rounded-2xl border"
          style={{ borderColor: palette.border }}
        />

        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="skeleton h-40 rounded-2xl border"
            style={{ borderColor: palette.border }}
          />
        ))}
      </div>

      <aside>
        <div
          className="skeleton h-64 rounded-2xl border"
          style={{ borderColor: palette.border }}
        />
      </aside>
    </div>
  );
}

function PropertyPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: property, isLoading, isError } = useBrowserPropertyDetails(id);
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
    <main className="">
      <DashboardNavbar activeTab={"dashboard"} />

      <section
        className="px-4 py-8"
        style={{ backgroundColor: palette.sectionBg }}
      >
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard/my-properties"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            <ArrowLeft size={16} />
            Back to Listings
          </Link>
          <div className="text-2xl mb-6">See what Potential Tenants See</div>

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

export default PropertyPreviewPage;
