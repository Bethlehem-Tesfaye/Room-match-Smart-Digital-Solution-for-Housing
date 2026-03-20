import PropertyListCard from "./PropertyListCard";
import PropertyPagination from "./PropertyPagination";
import type { Property } from "../types/type";
import { palette } from "../../../theme/palette";

interface SavedPropertiesSectionProps {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleFavorite: (property: Property) => void;
  favoritePropertyId: string | null;
}

function SavedPropertiesSection({
  properties,
  isLoading,
  isError,
  page,
  totalPages,
  onPageChange,
  onToggleFavorite,
  favoritePropertyId,
}: SavedPropertiesSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="skeleton h-80 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex min-h-[45vh] items-center justify-center rounded-2xl border p-6 text-sm"
        style={{ borderColor: "#E1D8FA", color: palette.purple }}
      >
        Couldn&apos;t load saved properties right now.
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className="flex min-h-[45vh] items-center justify-center rounded-2xl border p-6 text-sm"
        style={{ borderColor: "#E1D8FA", color: palette.purple }}
      >
        You have no saved properties yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => (
          <PropertyListCard
            key={property._id}
            property={property}
            onToggleFavorite={onToggleFavorite}
            isFavoriteLoading={favoritePropertyId === property._id}
          />
        ))}
      </div>

      <PropertyPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default SavedPropertiesSection;
