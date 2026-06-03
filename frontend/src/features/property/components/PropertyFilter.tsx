import { X } from "lucide-react";
import { useAmenities } from "../hooks/usePropertyHooks";
import type { PropertyCountFilter, PropertyType } from "../types/type";
import { palette } from "../../../theme/palette";

type PropertyTypeFilter = PropertyType | "All Types";
type PropertyFilters = {
  minPrice: number;
  maxPrice: number;
  propertyType: PropertyTypeFilter;
  bedrooms: PropertyCountFilter;
  bathrooms: PropertyCountFilter;
  amenities: string[];
};

interface PropertyFilterProps {
  isOpen: boolean;
  onClose: () => void;
  minPrice: number;
  maxPrice: number;
  propertyType: PropertyTypeFilter;
  bedrooms: PropertyCountFilter;
  bathrooms: PropertyCountFilter;
  amenities: string[];
  onChange: (filters: PropertyFilters) => void;
  onClear: () => void;
}

const PROPERTY_TYPES: Array<{ label: string; value: PropertyTypeFilter }> = [
  { label: "All Types", value: "All Types" },
  { label: "Apartment", value: "Apartment" },
  { label: "House", value: "House" },
  { label: "Condo", value: "Condo" },
  { label: "Studio", value: "Studio" },
  { label: "Shared room", value: "SharedRoom" },
];

const BED_BATH_OPTIONS: PropertyCountFilter[] = [
  "Any",
  "1",
  "2",
  "3",
  "4",
  "5+",
];

const MIN_PRICE = 0;
const MAX_PRICE = 200000;

interface FilterPanelContentProps {
  minPrice: number;
  maxPrice: number;
  propertyType: PropertyTypeFilter;
  bedrooms: PropertyCountFilter;
  bathrooms: PropertyCountFilter;
  amenities: string[];
  onChange: (filters: PropertyFilters) => void;
  onClear: () => void;
  showHeader?: boolean;
  onClose?: () => void;
}

function FilterPanelContent({
  minPrice,
  maxPrice,
  propertyType,
  bedrooms,
  bathrooms,
  amenities,
  onChange,
  onClear,
  showHeader = false,
  onClose,
}: FilterPanelContentProps) {
  const { data: amenitiesList, isLoading: amenitiesLoading } = useAmenities();

  const applyFilters = (nextFilters: PropertyFilters) => {
    onChange(nextFilters);
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    which: "min" | "max",
  ) => {
    const value = Number(e.target.value);

    if (Number.isNaN(value)) return;

    if (which === "min") {
      applyFilters({
        minPrice: Math.min(Math.max(value, MIN_PRICE), maxPrice),
        maxPrice,
        propertyType,
        bedrooms,
        bathrooms,
        amenities,
      });
    } else {
      applyFilters({
        minPrice,
        maxPrice: Math.max(Math.min(value, MAX_PRICE), minPrice),
        propertyType,
        bedrooms,
        bathrooms,
        amenities,
      });
    }
  };

  const handleTypeSelect = (value: PropertyTypeFilter) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType: value,
      bedrooms,
      bathrooms,
      amenities,
    });
  };

  const handleBedroomsSelect = (value: PropertyCountFilter) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType,
      bedrooms: value,
      bathrooms,
      amenities,
    });
  };

  const handleBathroomsSelect = (value: PropertyCountFilter) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType,
      bedrooms,
      bathrooms: value,
      amenities,
    });
  };

  const handleAmenityChange = (amenityId: string) => {
    if (amenities.includes(amenityId)) {
      applyFilters({
        minPrice,
        maxPrice,
        propertyType,
        bedrooms,
        bathrooms,
        amenities: amenities.filter((id) => id !== amenityId),
      });
    } else {
      applyFilters({
        minPrice,
        maxPrice,
        propertyType,
        bedrooms,
        bathrooms,
        amenities: [...amenities, amenityId],
      });
    }
  };

  const sectionLabelStyle = {
    color: palette.softPurple,
  };

  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? palette.purple : palette.chipBg,
    color: active ? "#FFFFFF" : "var(--app-text)",
    border: `1px solid ${active ? palette.purple : palette.border}`,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader ? (
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: palette.border }}
        >
          <h2
            className="text-base font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            Filters
          </h2>
          {onClose ? (
            <button
              type="button"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg"
              onClick={onClose}
              aria-label="Close filter panel"
              style={{ color: palette.softPurple }}
            >
              <X size={20} />
            </button>
          ) : null}
        </div>
      ) : (
        <h2
          className="mb-5 text-base font-bold"
          style={{ color: "var(--palette-deep)" }}
        >
          Filters
        </h2>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-0 lg:py-0">
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={sectionLabelStyle}>
            Price range
          </p>
          <p
            className="mb-3 text-sm"
            style={{ color: "var(--app-text)" }}
          >
            ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}
          </p>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="number"
              min={MIN_PRICE}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => handlePriceChange(e, "min")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
                color: "var(--app-text)",
              }}
            />
            <span style={{ color: palette.softPurple }}>–</span>
            <input
              type="number"
              min={minPrice}
              max={MAX_PRICE}
              value={maxPrice}
              onChange={(e) => handlePriceChange(e, "max")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
                color: "var(--app-text)",
              }}
            />
          </div>
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={minPrice}
            onChange={(e) => handlePriceChange(e, "min")}
            className="mb-2 w-full cursor-pointer"
            style={{ accentColor: palette.purple }}
          />
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={maxPrice}
            onChange={(e) => handlePriceChange(e, "max")}
            className="w-full cursor-pointer"
            style={{ accentColor: palette.purple }}
          />
        </div>

        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={sectionLabelStyle}>
            Property type
          </p>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => {
              const active = propertyType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-90"
                  style={chipStyle(active)}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={sectionLabelStyle}>
            Bedrooms
          </p>
          <div className="flex flex-wrap gap-2">
            {BED_BATH_OPTIONS.map((opt) => {
              const active = bedrooms === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleBedroomsSelect(opt)}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-90"
                  style={chipStyle(active)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={sectionLabelStyle}>
            Bathrooms
          </p>
          <div className="flex flex-wrap gap-2">
            {BED_BATH_OPTIONS.map((opt) => {
              const active = bathrooms === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleBathroomsSelect(opt)}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-90"
                  style={chipStyle(active)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={sectionLabelStyle}>
            Amenities
          </p>
          <div className="flex flex-col gap-2.5">
            {amenitiesLoading ? (
              <span className="text-xs" style={{ color: palette.softPurple }}>
                Loading amenities...
              </span>
            ) : amenitiesList && amenitiesList.length > 0 ? (
              amenitiesList.map((amenity) => (
                <label
                  key={amenity._id}
                  className="flex cursor-pointer items-center gap-2.5 text-sm"
                  style={{ color: "var(--app-text)" }}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded"
                    style={{ accentColor: palette.purple }}
                    checked={amenities.includes(amenity._id)}
                    onChange={() => handleAmenityChange(amenity._id)}
                  />
                  {amenity.name}
                </label>
              ))
            ) : (
              <span className="text-xs" style={{ color: palette.softPurple }}>
                No amenities found
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
          style={{
            borderColor: palette.border,
            color: "var(--palette-deep)",
            backgroundColor: palette.chipBg,
          }}
          onClick={onClear}
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}

const PropertyFilter: React.FC<PropertyFilterProps> = ({
  isOpen,
  onClose,
  minPrice,
  maxPrice,
  propertyType,
  bedrooms,
  bathrooms,
  amenities,
  onChange,
  onClear,
}) => {
  const filterProps = {
    minPrice,
    maxPrice,
    propertyType,
    bedrooms,
    bathrooms,
    amenities,
    onChange,
    onClear,
  };

  return (
    <>
      <aside
        className="hidden min-h-0 w-[280px] shrink-0 lg:flex lg:flex-col"
        aria-label="Property filters"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border p-5"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <FilterPanelContent {...filterProps} />
        </div>
      </aside>

      <div className="lg:hidden">
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          className={`fixed bottom-0 left-0 right-0 z-700 flex max-h-[85vh] transform flex-col overflow-hidden rounded-t-xl border-t transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
          style={{
            backgroundColor: palette.cardBg,
            borderColor: palette.border,
          }}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <FilterPanelContent
            {...filterProps}
            showHeader
            onClose={onClose}
          />
        </aside>
      </div>
    </>
  );
};

export default PropertyFilter;
