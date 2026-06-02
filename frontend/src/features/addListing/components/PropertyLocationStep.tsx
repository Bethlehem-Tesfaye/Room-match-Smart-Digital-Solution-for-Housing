import type { AddListingDraft, SetAddListingField } from "../types/types";

interface PropertyLocationStepProps {
  draft: AddListingDraft;
  setField: SetAddListingField;
  errors: {
    address?: string;
    city?: string;
  };
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

function PropertyLocationStep({
  draft,
  setField,
  errors,
}: PropertyLocationStepProps) {
  const inputStyle = (hasErr?: string) => ({
    borderColor: hasErr ? "#dc2626" : "var(--palette-border)",
    backgroundColor: "var(--palette-input-bg)",
    color: "var(--palette-deep)",
  });

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--palette-soft-purple)" }}>
        Where is your property located?
      </p>

      <Field label="Street address *" error={errors.address}>
        <input
          value={draft.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="123 Main Street, Apt 4B"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={inputStyle(errors.address)}
        />
      </Field>

      <Field label="City *" error={errors.city}>
        <input
          value={draft.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="Addis Ababa"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={inputStyle(errors.city)}
        />
      </Field>
    </div>
  );
}

export default PropertyLocationStep;
