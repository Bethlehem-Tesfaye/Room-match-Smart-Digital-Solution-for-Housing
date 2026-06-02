import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyListCard from "../../features/property/components/PropertyListCard";
import PropertyPagination from "../../features/property/components/PropertyPagination";
import PropertyFilter from "../../features/property/components/PropertyFilter";
import {
  useAmenities,
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
import { ChevronRight, ListFilter, Search, SearchX, X } from "lucide-react";

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

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: amenitiesList } = useAmenities();
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
  const totalResults = data?.pagination.total ?? 0;

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

  const handleFilterChange = (nextFilters: PropertyFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const activeFilterPills: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (
    filters.minPrice > DEFAULT_MIN_PRICE ||
    filters.maxPrice < DEFAULT_MAX_PRICE
  ) {
    activeFilterPills.push({
      key: "price",
      label: `$${filters.minPrice.toLocaleString()} – $${filters.maxPrice.toLocaleString()}`,
      onRemove: () =>
        handleFilterChange({
          ...filters,
          minPrice: DEFAULT_MIN_PRICE,
          maxPrice: DEFAULT_MAX_PRICE,
        }),
    });
  }

  if (filters.propertyType !== "All Types") {
    activeFilterPills.push({
      key: "type",
      label: filters.propertyType,
      onRemove: () =>
        handleFilterChange({ ...filters, propertyType: "All Types" }),
    });
  }

  if (filters.bedrooms !== "Any") {
    activeFilterPills.push({
      key: "bedrooms",
      label: `${filters.bedrooms} bed${filters.bedrooms === "1" ? "" : "s"}`,
      onRemove: () => handleFilterChange({ ...filters, bedrooms: "Any" }),
    });
  }

  if (filters.bathrooms !== "Any") {
    activeFilterPills.push({
      key: "bathrooms",
      label: `${filters.bathrooms} bath${filters.bathrooms === "1" ? "" : "s"}`,
      onRemove: () => handleFilterChange({ ...filters, bathrooms: "Any" }),
    });
  }

  filters.amenities.forEach((amenityId) => {
    const amenityName =
      amenitiesList?.find((amenity) => amenity._id === amenityId)?.name ??
      "Amenity";
    activeFilterPills.push({
      key: `amenity-${amenityId}`,
      label: amenityName,
      onRemove: () =>
        handleFilterChange({
          ...filters,
          amenities: filters.amenities.filter((id) => id !== amenityId),
        }),
    });
  });

  return (
    <main
      className="min-h-screen pb-12"
      style={{ backgroundColor: palette.pageBg }}
    >
      <LandingNavbar />

      <div className="mx-auto max-w-7xl px-4 pt-24">
        <nav
          className="mb-2 flex items-center gap-1 text-[11px]"
          style={{ color: palette.softPurple }}
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className="transition-opacity hover:opacity-80"
            style={{ color: palette.softPurple }}
          >
            Home
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: "var(--app-text)" }}>Properties</span>
        </nav>

        <header className="mb-6">
          <h1
            className="font-serif text-3xl font-bold md:text-4xl"
            style={{ color: "var(--palette-deep)" }}
          >
            Find your next home
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: palette.softPurple }}
          >
            {isLoading
              ? "Loading properties..."
              : `${totalResults.toLocaleString()} propert${totalResults === 1 ? "y" : "ies"} found`}
          </p>
        </header>

        <div
          className="sticky top-18 z-40 -mx-4 mb-6 border-b px-4 py-4"
          style={{
            backgroundColor: palette.pageBg,
            borderColor: palette.border,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex min-h-11 flex-1 items-center gap-2 rounded-full border px-4"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Search size={16} style={{ color: palette.softPurple }} />
              <input
                type="text"
                placeholder="Search by city or address..."
                className="h-11 flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--app-text)" }}
                onChange={handleSearchInputChange}
                value={searchInput}
              />
            </div>
            <button
              className="relative inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold lg:hidden"
              type="button"
              onClick={() => setIsFilterOpen(true)}
              style={{
                borderColor: palette.border,
                color: "var(--palette-deep)",
                backgroundColor: palette.cardBg,
              }}
            >
              <ListFilter size={16} />
              Filters
              {activeFilterCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: palette.purple }}
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          {activeFilterPills.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={pill.onRemove}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: palette.chipBg,
                    color: "var(--app-text)",
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  {pill.label}
                  <X size={12} style={{ color: palette.softPurple }} />
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold transition-opacity hover:opacity-80"
                style={{ color: palette.purple }}
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex gap-8">
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

          <section className="min-w-0 flex-1">
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="skeleton min-h-85 min-w-70 rounded-xl"
                  />
                ))}
              </div>
            ) : isError ? (
              <div
                className="rounded-xl border p-8 text-center text-sm"
                style={{ borderColor: palette.border, color: palette.purple }}
              >
                Couldn&apos;t load properties right now.
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border px-6 py-16 text-center">
                <SearchX
                  size={40}
                  className="mb-4"
                  style={{ color: palette.softPurple }}
                />
                <p
                  className="text-base font-bold"
                  style={{ color: "var(--palette-deep)" }}
                >
                  No properties match your filters
                </p>
                <p
                  className="mt-2 max-w-sm text-sm leading-relaxed"
                  style={{ color: palette.softPurple }}
                >
                  Try adjusting your search or clearing some filters to see more
                  listings.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 min-h-11 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: palette.purple }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
          </section>
        </div>
      </div>

      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default PropertiesPage;
