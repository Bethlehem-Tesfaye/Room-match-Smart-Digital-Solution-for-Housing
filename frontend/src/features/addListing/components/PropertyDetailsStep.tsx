import { ChevronDown } from "lucide-react";
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
    leasePeriod?: string;
    initialPayment?: string;
  };
}

function Field({
  label,
  error,
  children,
  span2,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${span2 ? "md:col-span-2" : ""}`}>
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

const inputCls = "w-full rounded-xl border px-4 py-2.5 text-sm outline-none";

function PropertyDetailsStep({
  draft,
  setField,
  errors,
}: PropertyDetailsStepProps) {
  const borderColor = (hasErr?: string) =>
    hasErr ? "#dc2626" : "var(--palette-border)";
  const baseInputStyle = (hasErr?: string) => ({
    borderColor: borderColor(hasErr),
    backgroundColor: "var(--palette-input-bg)",
    color: "var(--palette-deep)",
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Listing title *" error={errors.title} span2>
        <input
          value={draft.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="e.g., Sunny 2BR apartment in downtown"
          className={inputCls}
          style={baseInputStyle(errors.title)}
        />
      </Field>

      <Field label="Description" span2>
        <textarea
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Describe your property, its unique features, and the neighbourhood…"
          className="h-28 w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none"
          style={baseInputStyle()}
        />
      </Field>

      {/* Roommates */}
      <div
        className="md:col-span-2 rounded-xl border px-4 py-3"
        style={{
          borderColor: "var(--palette-border)",
          backgroundColor: "var(--palette-section-bg)",
        }}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.allowRoommates}
            onChange={(e) => setField("allowRoommates", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded"
          />
          <span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--palette-deep)" }}
            >
              Allow roommates
            </span>
            <span
              className="mt-0.5 block text-xs"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Tenants renting this property can use the roommate matching
              feature.
            </span>
          </span>
        </label>
      </div>

      <Field label="Property type">
        <div className="relative">
          <select
            value={draft.propertyType}
            onChange={(e) =>
              setField(
                "propertyType",
                e.target.value as AddListingDraft["propertyType"],
              )
            }
            className={`${inputCls} appearance-none pr-10`}
            style={baseInputStyle()}
          >
            {propertyTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            size={14}
            style={{ color: "var(--palette-soft-purple)" }}
          />
        </div>
      </Field>

      <Field label="Monthly rent *" error={errors.price}>
        <input
          value={draft.price}
          onChange={(e) =>
            setField("price", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="2000"
          className={inputCls}
          style={baseInputStyle(errors.price)}
        />
      </Field>

      <Field label="Currency">
        <div className="relative">
          <select
            value={draft.currency}
            onChange={(e) => setField("currency", e.target.value)}
            className={`${inputCls} appearance-none pr-10`}
            style={baseInputStyle()}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            size={14}
            style={{ color: "var(--palette-soft-purple)" }}
          />
        </div>
      </Field>

      <Field label="Deposit">
        <input
          value={draft.deposit}
          onChange={(e) =>
            setField("deposit", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="1000"
          className={inputCls}
          style={baseInputStyle()}
        />
      </Field>

      <Field label="Lease period (months) *" error={errors.leasePeriod}>
        <input
          value={draft.leasePeriod}
          onChange={(e) =>
            setField("leasePeriod", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="12"
          className={inputCls}
          style={baseInputStyle(errors.leasePeriod)}
        />
      </Field>

      <Field label="Initial payment *" error={errors.initialPayment}>
        <input
          value={draft.initialPayment}
          onChange={(e) =>
            setField("initialPayment", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="500"
          className={inputCls}
          style={baseInputStyle(errors.initialPayment)}
        />
      </Field>

      <Field label="Bedrooms *" error={errors.numberOfBedrooms}>
        <input
          value={draft.numberOfBedrooms}
          onChange={(e) =>
            setField("numberOfBedrooms", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="2"
          className={inputCls}
          style={baseInputStyle(errors.numberOfBedrooms)}
        />
      </Field>

      <Field label="Bathrooms *" error={errors.numberOfBathrooms}>
        <input
          value={draft.numberOfBathrooms}
          onChange={(e) =>
            setField("numberOfBathrooms", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="1"
          className={inputCls}
          style={baseInputStyle(errors.numberOfBathrooms)}
        />
      </Field>

      <Field label="Area (sq ft)">
        <input
          value={draft.areaSqFt}
          onChange={(e) =>
            setField("areaSqFt", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="1000"
          className={inputCls}
          style={baseInputStyle()}
        />
      </Field>

      <Field label="Floor number">
        <input
          value={draft.floorNumber}
          onChange={(e) =>
            setField("floorNumber", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="3"
          className={inputCls}
          style={baseInputStyle()}
        />
      </Field>

      <Field label="Total floors">
        <input
          value={draft.totalFloors}
          onChange={(e) =>
            setField("totalFloors", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="10"
          className={inputCls}
          style={baseInputStyle()}
        />
      </Field>
    </div>
  );
}

export default PropertyDetailsStep;
