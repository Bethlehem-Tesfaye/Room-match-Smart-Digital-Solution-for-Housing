import { useAmenities } from "../hooks/usePropertyHooks";
import type { PropertyCountFilter, PropertyType } from "../types/type";

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
  { label: "Shared Room", value: "SharedRoom" },
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
  // Get amenities from DB
  const { data: amenitiesList, isLoading: amenitiesLoading } = useAmenities();
  const applyFilters = (nextFilters: PropertyFilters) => {
    onChange(nextFilters);
  };

  // Handlers for each filter
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

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType: e.target.value as PropertyTypeFilter,
      bedrooms,
      bathrooms,
      amenities,
    });
  };
  const handleBedroomsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType,
      bedrooms: e.target.value as PropertyCountFilter,
      bathrooms,
      amenities,
    });
  };
  const handleBathroomsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({
      minPrice,
      maxPrice,
      propertyType,
      bedrooms,
      bathrooms: e.target.value as PropertyCountFilter,
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

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-700 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            className="text-gray-500 cursor-pointer hover:text-gray-800 text-2xl font-bold px-2 py-1 rounded-full focus:outline-none"
            onClick={onClose}
            aria-label="Close filter panel"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Price Range: ${minPrice} - ${maxPrice}
            </label>
            <div className="flex gap-2  cursor-pointer items-center mb-2">
              <input
                type="number"
                min={MIN_PRICE}
                max={maxPrice}
                value={minPrice}
                onChange={(e) => handlePriceChange(e, "min")}
                className="w-24 border  cursor-pointer rounded px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                min={minPrice}
                max={MAX_PRICE}
                value={maxPrice}
                onChange={(e) => handlePriceChange(e, "max")}
                className="w-24 border rounded  cursor-pointer px-2 py-1 text-sm"
              />
            </div>
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={minPrice}
              onChange={(e) => handlePriceChange(e, "min")}
              className="w-full accent-purple-600 cursor-pointer mb-1"
            />
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={maxPrice}
              onChange={(e) => handlePriceChange(e, "max")}
              className="w-full accent cursor-pointer-purple-600"
            />
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Property Type
            </label>
            <select
              className="w-full border rounded cursor-pointer px-3 py-2 bg-gray-50 text-sm"
              value={propertyType}
              onChange={handleTypeChange}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bedrooms</label>
            <select
              className="w-full border rounded cursor-pointer px-3 py-2 bg-gray-50 text-sm"
              value={bedrooms}
              onChange={handleBedroomsChange}
            >
              {BED_BATH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Bathrooms */}
          <div className="mb-6">
            <label className="block text-sm cursor-pointer font-medium mb-2">
              Bathrooms
            </label>
            <select
              className="w-full cursor-pointer border rounded px-3 py-2 bg-gray-50 text-sm"
              value={bathrooms}
              onChange={handleBathroomsChange}
            >
              {BED_BATH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Amenities */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {amenitiesLoading ? (
                <span className="col-span-2 cursor-pointer text-gray-400">
                  Loading amenities...
                </span>
              ) : amenitiesList && amenitiesList.length > 0 ? (
                amenitiesList.map((amenity) => (
                  <label
                    key={amenity._id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className=" cursor-pointer"
                      checked={amenities.includes(amenity._id)}
                      onChange={() => handleAmenityChange(amenity._id)}
                    />
                    {amenity.name}
                  </label>
                ))
              ) : (
                <span className="col-span-2 text-gray-400">
                  No amenities found
                </span>
              )}
            </div>
          </div>

          {/* Clear All Filters Button */}
          <button
            className="w-full mt-2 py-2 cursor-pointer rounded bg-gray-100 text-gray-700 font-semibold border border-gray-200 hover:bg-gray-200 transition"
            onClick={onClear}
          >
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  );
};

export default PropertyFilter;
