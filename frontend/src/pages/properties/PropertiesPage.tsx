import { useEffect, useState } from "react";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyListCard from "../../features/property/components/PropertyListCard";
import PropertyPagination from "../../features/property/components/PropertyPagination";
import PropertyFilter from "../../features/property/components/PropertyFilter";
import {
  useBrowserProperties,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type {
  Property,
  PropertyCountFilter,
  PropertyType,
} from "../../features/property/types/type";
import { palette } from "../../theme/palette";
import { ListFilter, Search } from "lucide-react";

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 200000;

type PropertyTypeFilter = PropertyType | "All Types";

type PropertyFilters = {
  minPrice: number;
  maxPrice: number;
  propertyType: PropertyTypeFilter;
  bedrooms: PropertyCountFilter;
  bathrooms: PropertyCountFilter;
  amenities: string[];
};

const DEFAULT_FILTERS: PropertyFilters = {
  minPrice: DEFAULT_MIN_PRICE,
  maxPrice: DEFAULT_MAX_PRICE,
  propertyType: "All Types",
  bedrooms: "Any",
  bathrooms: "Any",
  amenities: [],
};

function PropertiesPage() {
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);

  // Count active filters
  const activeFilterCount = (() => {
    let count = 0;
    if (
      filters.minPrice > DEFAULT_MIN_PRICE ||
      filters.maxPrice < DEFAULT_MAX_PRICE
    )
      count++;
    if (filters.propertyType !== "All Types") count++;
    if (filters.bedrooms !== "Any") count++;
    if (filters.bathrooms !== "Any") count++;
    if (filters.amenities.length > 0) count++;
    return count;
  })();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useBrowserProperties({
    page,
    limit: 20,
    search: searchQuery,
    minPrice:
      filters.minPrice > DEFAULT_MIN_PRICE ? filters.minPrice : undefined,
    maxPrice:
      filters.maxPrice < DEFAULT_MAX_PRICE ? filters.maxPrice : undefined,
    propertyType:
      filters.propertyType === "All Types" ? undefined : filters.propertyType,
    bedrooms: filters.bedrooms === "Any" ? undefined : filters.bedrooms,
    bathrooms: filters.bathrooms === "Any" ? undefined : filters.bathrooms,
    amenities: filters.amenities.length ? filters.amenities : undefined,
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

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setSearchInput(value);
    setSearchQuery(value.trim());
    setPage(1);
  };

  // Filter change handler
  const handleFilterChange = (nextFilters: PropertyFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <main className="pt-24  min-h-screen">
      <LandingNavbar />
      <div
        className="fixed left-0 right-0 top-18.5 z-50 border-b pt-3 h-19 -mt-6 bg-white/95 px-4 backdrop-blur "
        style={{ backgroundColor: palette.sectionBg }}
      >
        <div className="mb-8 mx-auto flex max-w-6xl  items-center gap-4 z-50  ">
          <div
            className="flex items-center flex-1  rounded-lg px-4 py-1 border  bg-white border-[#e5e7eb]"
            style={{ backgroundColor: palette.inputBg }}
          >
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by city, or address..."
              className="flex-1 h-11 bg-transparent placeholder-gray-400 rounded-xl border-0  px-4 text-sm text-slate-800 outline-none"
              onChange={handleSearchInputChange}
              value={searchInput}
            />
          </div>
          <button
            className="relative cursor-pointer flex items-center gap-2 px-4 py-3 bg-white border border-[#e5e7eb] rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            type="button"
            onClick={() => setIsFilterOpen(true)}
          >
            <ListFilter size={17} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <section
        className="px-4 py-12 mt-6"
        style={{ backgroundColor: palette.sectionBg }}
      >
        <div className="mx-auto max-w-6xl">
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
              className="rounded-2xl border p-6 text-sm flex items-center justify-center"
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

      <PropertyFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        propertyType={filters.propertyType}
        bedrooms={filters.bedrooms}
        bathrooms={filters.bathrooms}
        amenities={filters.amenities}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default PropertiesPage;
