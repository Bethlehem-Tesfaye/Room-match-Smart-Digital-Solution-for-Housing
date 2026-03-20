import { Calendar } from "lucide-react";
import { palette } from "../../../theme/palette";
import type { Amenity } from "../../property/types/type";
import type { AddListingDraft, SetAddListingField } from "../types/types";

interface PropertyAmenitiesStepProps {
  draft: AddListingDraft;
  amenities: Amenity[];
  setField: SetAddListingField;
  onToggleAmenity: (amenityId: string) => void;
}

function PropertyAmenitiesStep({
  draft,
  amenities,
  setField,
  onToggleAmenity,
}: PropertyAmenitiesStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div
          className="mb-1 text-lg font-semibold"
          style={{ color: palette.deep }}
        >
          Amenities & Final Details
        </div>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Almost done! Add the finishing touches
        </p>
      </div>

      <div>
        <p
          className="mb-2 text-sm font-semibold"
          style={{ color: palette.deep }}
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
                className="rounded-md border px-3 py-2 text-sm font-semibold"
                style={{
                  borderColor: selected ? palette.purple : palette.border,
                  backgroundColor: selected ? palette.chipBg : palette.cardBg,
                  color: selected ? palette.purple : palette.deep,
                }}
                onClick={() => onToggleAmenity(amenity._id)}
              >
                {amenity.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Available From
          </label>
          <div className="relative">
            <input
              type="date"
              value={draft.availableFrom}
              onChange={(event) =>
                setField("availableFrom", event.target.value)
              }
              className="w-full rounded-lg border px-4 py-2 pr-10 outline-none"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
                color: palette.deep,
              }}
            />
            <Calendar
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              size={16}
              style={{ color: palette.softPurple }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Furnished
          </label>
          <button
            type="button"
            onClick={() => setField("isFurnished", !draft.isFurnished)}
            className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors"
            style={{
              backgroundColor: draft.isFurnished
                ? palette.purple
                : palette.border,
            }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
              style={{
                transform: draft.isFurnished
                  ? "translateX(30px)"
                  : "translateX(4px)",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyAmenitiesStep;
