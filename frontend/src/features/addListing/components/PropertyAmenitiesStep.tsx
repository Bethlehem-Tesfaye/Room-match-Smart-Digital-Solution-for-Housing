import type { Amenity } from "../../property/types/type";
import type { AddListingDraft, SetAddListingField } from "../types/types";
import { todayDateInputMin } from "../utils/availableFromValidation";

interface PropertyAmenitiesStepProps {
  draft: AddListingDraft;
  amenities: Amenity[];
  setField: SetAddListingField;
  onToggleAmenity: (amenityId: string) => void;
  errors: {
    availableFrom?: string;
  };
  onAvailableFromBlur: () => void;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--palette-soft-purple)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function PropertyAmenitiesStep({
  draft,
  amenities,
  setField,
  onToggleAmenity,
  errors,
  onAvailableFromBlur,
}: PropertyAmenitiesStepProps) {
  const minDate = todayDateInputMin();

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: "var(--palette-soft-purple)" }}>
        Almost done! Add the finishing touches to your listing.
      </p>

      {/* Amenities */}
      <div>
        <p
          className="mb-3 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          Amenities
        </p>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const selected = draft.amenityIds.includes(amenity._id);
            return (
              <button
                key={amenity._id}
                type="button"
                onClick={() => onToggleAmenity(amenity._id)}
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: selected ? "#8b64c8" : "var(--palette-border)",
                  backgroundColor: selected
                    ? "#f0ebff"
                    : "var(--palette-card-bg)",
                  color: selected ? "#8b64c8" : "var(--palette-deep)",
                }}
              >
                {amenity.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available from + furnished */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Available from *" error={errors.availableFrom}>
          <input
            type="date"
            required
            min={minDate}
            value={draft.availableFrom}
            onChange={(e) => setField("availableFrom", e.target.value)}
            onBlur={onAvailableFromBlur}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{
              borderColor: errors.availableFrom
                ? "#dc2626"
                : "var(--palette-border)",
              backgroundColor: "var(--palette-input-bg)",
              color: "var(--palette-deep)",
            }}
          />
        </Field>

        <div className="space-y-1.5">
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Furnished
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setField("isFurnished", !draft.isFurnished)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{
                backgroundColor: draft.isFurnished
                  ? "#8b64c8"
                  : "var(--palette-border)",
              }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{
                  transform: draft.isFurnished
                    ? "translateX(26px)"
                    : "translateX(4px)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyAmenitiesStep;
