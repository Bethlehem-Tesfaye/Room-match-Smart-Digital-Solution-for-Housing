import { MapPin } from "lucide-react";
import { palette } from "../../../theme/palette";
import type { AddListingDraft, SetAddListingField } from "../types/types";

interface PropertyLocationStepProps {
  draft: AddListingDraft;
  setField: SetAddListingField;
  errors: {
    address?: string;
    city?: string;
  };
}

function PropertyLocationStep({
  draft,
  setField,
  errors,
}: PropertyLocationStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div
          className="mb-1 flex items-center gap-2 text-lg font-semibold"
          style={{ color: palette.deep }}
        >
          <MapPin size={18} style={{ color: palette.purple }} />
          Location
        </div>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Where is your property located?
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Street Address *
        </label>
        <input
          value={draft.address}
          onChange={(event) => setField("address", event.target.value)}
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor: errors.address ? "rgb(220 38 38)" : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="123 Main Street, Apt 4B"
        />
        {errors.address ? (
          <p className="text-sm text-red-600">{errors.address}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          City *
        </label>
        <input
          value={draft.city}
          onChange={(event) => setField("city", event.target.value)}
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor: errors.city ? "rgb(220 38 38)" : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="Addis Ababa"
        />
        {errors.city ? (
          <p className="text-sm text-red-600">{errors.city}</p>
        ) : null}
      </div>
    </div>
  );
}

export default PropertyLocationStep;
