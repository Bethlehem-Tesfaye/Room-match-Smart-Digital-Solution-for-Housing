import { ChevronDown, ImageIcon } from "lucide-react";
import { palette } from "../../../theme/palette";
import {
  currencyOptions,
  propertyTypeOptions,
} from "./addListingForm.constants";
import type { AddListingDraft, SetAddListingField } from "../types/types";

interface PropertyDetailsStepProps {
  draft: AddListingDraft;
  setField: SetAddListingField;
  errors: {
    title?: string;
    price?: string;
    numberOfBedrooms?: string;
    numberOfBathrooms?: string;
  };
}

function PropertyDetailsStep({
  draft,
  setField,
  errors,
}: PropertyDetailsStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div
          className="mb-1 flex items-center gap-2 text-lg font-semibold"
          style={{ color: palette.deep }}
        >
          <ImageIcon size={18} style={{ color: palette.purple }} />
          Property Details
        </div>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Basic information about your properties
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Listing Title *
        </label>
        <input
          value={draft.title}
          onChange={(event) => setField("title", event.target.value)}
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor: errors.title ? "rgb(220 38 38)" : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="e.g., Sunny 2BR Apartment in Downtown"
        />
        {errors.title ? (
          <p className="text-sm text-red-600">{errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Description
        </label>
        <textarea
          value={draft.description}
          onChange={(event) => setField("description", event.target.value)}
          className="h-32 w-full rounded-lg border px-4 py-3 outline-none"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="Describe your property, its unique features, and the neighborhood..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Property Type *
          </label>
          <div className="relative">
            <select
              value={draft.propertyType}
              onChange={(event) =>
                setField(
                  "propertyType",
                  event.target.value as AddListingDraft["propertyType"],
                )
              }
              className="w-full appearance-none rounded-lg border px-4 py-2 pr-10 outline-none"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
                color: palette.deep,
              }}
            >
              {propertyTypeOptions.map((propertyType) => (
                <option key={propertyType} value={propertyType}>
                  {propertyType}
                </option>
              ))}
            </select>
            <ChevronDown
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
            Monthly Rent *
          </label>
          <input
            value={draft.price}
            onChange={(event) =>
              setField("price", event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: errors.price ? "rgb(220 38 38)" : palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="2000"
          />
          {errors.price ? (
            <p className="text-sm text-red-600">{errors.price}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Currency
          </label>
          <div className="relative">
            <select
              value={draft.currency}
              onChange={(event) => setField("currency", event.target.value)}
              className="w-full appearance-none rounded-lg border px-4 py-2 pr-10 outline-none"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
                color: palette.deep,
              }}
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <ChevronDown
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
            Deposit
          </label>
          <input
            value={draft.deposit}
            onChange={(event) =>
              setField("deposit", event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="1000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Bedrooms *
          </label>
          <input
            value={draft.numberOfBedrooms}
            onChange={(event) =>
              setField(
                "numberOfBedrooms",
                event.target.value.replace(/[^\d]/g, ""),
              )
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: errors.numberOfBedrooms
                ? "rgb(220 38 38)"
                : palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="2"
          />
          {errors.numberOfBedrooms ? (
            <p className="text-sm text-red-600">{errors.numberOfBedrooms}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Bathrooms *
          </label>
          <input
            value={draft.numberOfBathrooms}
            onChange={(event) =>
              setField(
                "numberOfBathrooms",
                event.target.value.replace(/[^\d]/g, ""),
              )
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: errors.numberOfBathrooms
                ? "rgb(220 38 38)"
                : palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="1"
          />
          {errors.numberOfBathrooms ? (
            <p className="text-sm text-red-600">{errors.numberOfBathrooms}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Area (sq ft)
          </label>
          <input
            value={draft.areaSqFt}
            onChange={(event) =>
              setField("areaSqFt", event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="1000"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Floor Number
          </label>
          <input
            value={draft.floorNumber}
            onChange={(event) =>
              setField("floorNumber", event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="3"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            Total Floors
          </label>
          <input
            value={draft.totalFloors}
            onChange={(event) =>
              setField("totalFloors", event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-lg border px-4 py-2 outline-none"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
              color: palette.deep,
            }}
            placeholder="10"
          />
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailsStep;
