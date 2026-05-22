import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import type { RoommateFormData } from "../hooks/useRoommateData";

interface Props {
  preferences: RoommateFormData | null;
  onUpdate: (
    field: keyof RoommateFormData,
    value: string | number | string[] | null,
  ) => void;
  isSaving: boolean;
  isComputing: boolean;
  onSave: () => void;
  onSaveAndRecompute: () => void;
}

// ── helpers ────────────────────────────────────────────────────────────────
const sliderFill = (value: number) => {
  const pct = ((value - 1) / 4) * 100;
  return `linear-gradient(to right, var(--palette-light-purple) 0%, var(--palette-purple) ${pct}%, var(--palette-card-muted-bg) ${pct}%, var(--palette-card-muted-bg) 100%)`;
};

// ── sub-components ─────────────────────────────────────────────────────────
const SegGroup = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex gap-1 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          value === o.value
            ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm"
            : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const SliderRow = ({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="mb-4">
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--palette-soft-purple)">
        {label}
      </span>
      <span className="text-sm font-semibold text-(--palette-purple)">
        {value}
      </span>
    </div>
    <input
      type="range"
      min="1"
      max="5"
      step="1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
      style={{ background: sliderFill(value) }}
    />
    <div className="mt-1 flex justify-between text-[11px] text-(--palette-soft-purple)">
      <span>{leftLabel}</span>
      <span>{rightLabel}</span>
    </div>
  </div>
);

const PrefCard = ({
  label,
  leftLabel,
  rightLabel,
  scaleValue,
  importanceValue,
  onScaleChange,
  onImportanceChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  scaleValue: number;
  importanceValue: number;
  onScaleChange: (v: number) => void;
  onImportanceChange: (v: number) => void;
}) => (
  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-(--palette-deep)">
        {label}
      </span>
      <span className="rounded-full bg-(--palette-chip-bg) px-3 py-1 text-xs font-semibold text-(--palette-purple)">
        Importance {importanceValue}
      </span>
    </div>
    <SliderRow
      label="Preferred level"
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      value={scaleValue}
      onChange={onScaleChange}
    />
    <SliderRow
      label="How much does this matter?"
      leftLabel="Low"
      rightLabel="Very important"
      value={importanceValue}
      onChange={onImportanceChange}
    />
  </div>
);

const PolicyCard = ({
  title,
  options,
  value,
  importance,
  onPolicyChange,
  onImportanceChange,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  importance: number;
  onPolicyChange: (v: string) => void;
  onImportanceChange: (v: number) => void;
}) => (
  <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-(--palette-deep)">
        {title}
      </span>
      <span className="rounded-full bg-(--palette-chip-bg) px-3 py-1 text-xs font-semibold text-(--palette-purple)">
        Importance {importance}
      </span>
    </div>
    <div className="mb-3 flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPolicyChange(o.value)}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            value === o.value
              ? "bg-(--palette-card-bg) text-(--palette-purple) shadow-sm border border-(--palette-border)"
              : "text-(--palette-soft-purple) hover:text-(--palette-deep)"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-(--palette-soft-purple)">
        <span>Importance</span>
        <span>{importance}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={importance}
        onChange={(e) => onImportanceChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full border-0 outline-none"
        style={{ background: sliderFill(importance) }}
      />
    </div>
  </div>
);

// ── steps ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ["Your profile", "Preferences", "Policies", "Roommate fit"];

// ── main component ─────────────────────────────────────────────────────────
export const RoommateWizard: React.FC<Props> = ({
  preferences,
  onUpdate,
  isSaving,
  isComputing,
  onSave,
  onSaveAndRecompute,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  if (!preferences) return null;

  const p = preferences;

  // ── step 1: profile ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
            Current status
          </label>
          <SegGroup
            options={[
              { label: "Student", value: "Student" },
              { label: "Employed", value: "Employed" },
              { label: "Self-employed", value: "Self-employed" },
              { label: "Other", value: "Other" },
            ]}
            value={p.currentStatus ?? "Student"}
            onChange={(v) => onUpdate("currentStatus", v)}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
            Lifestyle
          </label>
          <SegGroup
            options={[
              { label: "Structured", value: "Structured" },
              { label: "Balanced", value: "Balanced" },
              { label: "Relaxed", value: "Relaxed" },
              { label: "Flexible", value: "Flexible" },
            ]}
            value={p.lifestyleType ?? "Balanced"}
            onChange={(v) => onUpdate("lifestyleType", v)}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Occupation / field of study
        </label>
        <input
          type="text"
          value={p.occupation ?? ""}
          onChange={(e) => onUpdate("occupation", e.target.value)}
          placeholder="e.g. Software engineering"
          className="w-full rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none placeholder:text-(--palette-soft-purple)"
        />
      </div>

      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Lifestyle traits
        </p>
        <SliderRow
          label="Social level at home"
          leftLabel="Very private"
          rightLabel="Very social"
          value={p.socialLevel ?? 3}
          onChange={(v) => onUpdate("socialLevel", v)}
        />
        <SliderRow
          label="Tidiness"
          leftLabel="Messy"
          rightLabel="Very tidy"
          value={p.cleanliness ?? 3}
          onChange={(v) => onUpdate("cleanliness", v)}
        />
        <SliderRow
          label="Sleep schedule"
          leftLabel="Early sleeper"
          rightLabel="Night owl"
          value={p.sleepSchedule ?? 3}
          onChange={(v) => onUpdate("sleepSchedule", v)}
        />
        <SliderRow
          label="Noise tolerance"
          leftLabel="Need silence"
          rightLabel="Very flexible"
          value={p.noiseTolerance ?? 3}
          onChange={(v) => onUpdate("noiseTolerance", v)}
        />
        <SliderRow
          label="Guest frequency"
          leftLabel="Never"
          rightLabel="Very often"
          value={p.guests ?? 3}
          onChange={(v) => onUpdate("guests", v)}
        />
        <SliderRow
          label="Shared space behavior"
          leftLabel="Independent"
          rightLabel="Highly interactive"
          value={p.interactionLevel ?? 3}
          onChange={(v) => onUpdate("interactionLevel", v)}
        />
        <SliderRow
          label="Shared responsibilities"
          leftLabel="Rarely participate"
          rightLabel="Always proactive"
          value={p.responsibility ?? 3}
          onChange={(v) => onUpdate("responsibility", v)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
            Do you smoke?
          </label>
          <SegGroup
            options={[
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ]}
            value={p.smoking ?? "no"}
            onChange={(v) => onUpdate("smoking", v)}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
            Do you have pets?
          </label>
          <SegGroup
            options={[
              { label: "No", value: "no" },
              { label: "Yes", value: "yes" },
            ]}
            value={p.pets ?? "no"}
            onChange={(v) => onUpdate("pets", v)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
            Do you drink alcohol?
          </label>
          <SegGroup
            options={[
              { label: "No", value: "no" },
              { label: "Occasionally", value: "sometimes" },
              { label: "Yes", value: "yes" },
            ]}
            value={p.drinking ?? "no"}
            onChange={(v) => onUpdate("drinking", v)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
        <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Monthly budget range
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={Number.isFinite(p.budgetMin) ? p.budgetMin : ""}
            onChange={(e) =>
              onUpdate(
                "budgetMin",
                e.target.value === "" ? Number.NaN : Number(e.target.value),
              )
            }
            className="flex-1 rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none"
          />
          <span className="text-sm text-(--palette-soft-purple)">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={p.budgetMax ?? ""}
            onChange={(e) =>
              onUpdate(
                "budgetMax",
                e.target.value === "" ? Number.NaN : Number(e.target.value),
              )
            }
            className="flex-1 rounded-2xl border border-(--palette-border) bg-(--palette-input-bg) px-4 py-3 text-(--app-text) outline-none"
          />
        </div>
      </div>
    </div>
  );

  // ── step 2: preferences ──────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-3">
      <PrefCard
        label="Cleanliness"
        leftLabel="Messy"
        rightLabel="Very tidy"
        scaleValue={p.preferredCleanliness ?? 3}
        importanceValue={p.cleanlinessWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredCleanliness", v)}
        onImportanceChange={(v) => onUpdate("cleanlinessWeight", v)}
      />
      <PrefCard
        label="Sleep schedule"
        leftLabel="Early sleeper"
        rightLabel="Night owl"
        scaleValue={p.preferredSleepSchedule ?? 3}
        importanceValue={p.sleepWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredSleepSchedule", v)}
        onImportanceChange={(v) => onUpdate("sleepWeight", v)}
      />
      <PrefCard
        label="Noise tolerance"
        leftLabel="Very quiet"
        rightLabel="Flexible/noisy ok"
        scaleValue={p.preferredNoiseTolerance ?? 3}
        importanceValue={p.noiseWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredNoiseTolerance", v)}
        onImportanceChange={(v) => onUpdate("noiseWeight", v)}
      />
      <PrefCard
        label="Guest frequency"
        leftLabel="No guests"
        rightLabel="Frequent guests"
        scaleValue={p.preferredGuests ?? 3}
        importanceValue={p.guestsWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredGuests", v)}
        onImportanceChange={(v) => onUpdate("guestsWeight", v)}
      />
      <PrefCard
        label="Social atmosphere"
        leftLabel="Very private"
        rightLabel="Very social"
        scaleValue={p.preferredSocialAtmosphere ?? 3}
        importanceValue={p.socialWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredSocialAtmosphere", v)}
        onImportanceChange={(v) => onUpdate("socialWeight", v)}
      />
      <PrefCard
        label="Interaction level"
        leftLabel="Independent"
        rightLabel="Highly interactive"
        scaleValue={p.preferredInteractionLevel ?? 3}
        importanceValue={p.interactionWeight ?? 3}
        onScaleChange={(v) => onUpdate("preferredInteractionLevel", v)}
        onImportanceChange={(v) => onUpdate("interactionWeight", v)}
      />
    </div>
  );

  // ── step 3: policies ─────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <PolicyCard
          title="Smoking"
          options={[
            { label: "Not allowed", value: "not-allowed" },
            { label: "Allowed", value: "allowed" },
            { label: "Outside only", value: "outside-only" },
          ]}
          value={p.smokingPolicy ?? "not-allowed"}
          importance={p.smokingImportance ?? 3}
          onPolicyChange={(v) => onUpdate("smokingPolicy", v)}
          onImportanceChange={(v) => onUpdate("smokingImportance", v)}
        />
        <PolicyCard
          title="Alcohol"
          options={[
            { label: "Not allowed", value: "not-allowed" },
            { label: "Occasionally", value: "occasionally" },
            { label: "Allowed", value: "allowed" },
          ]}
          value={p.alcoholPolicy ?? "occasionally"}
          importance={p.alcoholImportance ?? 3}
          onPolicyChange={(v) => onUpdate("alcoholPolicy", v)}
          onImportanceChange={(v) => onUpdate("alcoholImportance", v)}
        />
        <PolicyCard
          title="Pets"
          options={[
            { label: "Not allowed", value: "not-allowed" },
            { label: "Allowed", value: "allowed" },
            { label: "Depends", value: "depends" },
          ]}
          value={p.petsPolicy ?? "not-allowed"}
          importance={p.petsImportance ?? 3}
          onPolicyChange={(v) => onUpdate("petsPolicy", v)}
          onImportanceChange={(v) => onUpdate("petsImportance", v)}
        />
      </div>

      <div className="rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Hard limits
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
              Accept a smoker?
            </label>
            <SegGroup
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              value={p.acceptSmoker ?? "no"}
              onChange={(v) => onUpdate("acceptSmoker", v)}
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
              Accept pets?
            </label>
            <SegGroup
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              value={p.acceptPets ?? "no"}
              onChange={(v) => onUpdate("acceptPets", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
              Accept frequent guests?
            </label>
            <SegGroup
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              value={p.acceptGuests ?? "no"}
              onChange={(v) => onUpdate("acceptGuests", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ── step 4: fit ──────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Preferred roommate type
        </label>
        <SegGroup
          options={[
            { label: "Very similar", value: "Very similar" },
            { label: "Somewhat similar", value: "Somewhat similar" },
            { label: "Balanced", value: "Balanced" },
            { label: "Different is fine", value: "Different is fine" },
          ]}
          value={p.roommateType ?? "Balanced"}
          onChange={(v) => onUpdate("roommateType", v)}
        />
      </div>

      <SliderRow
        label="How strict are you about behavior?"
        leftLabel="Very flexible"
        rightLabel="Very strict"
        value={p.behaviorStrictness ?? 3}
        onChange={(v) => onUpdate("behaviorStrictness", v)}
      />

      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-(--palette-soft-purple)">
          Minimum stay duration
        </label>
        <SegGroup
          options={[
            { label: "1 month", value: "1" },
            { label: "3 months", value: "3" },
            { label: "6 months", value: "6" },
            { label: "12 months", value: "12" },
          ]}
          value={String(p.minimumStayMonths ?? 1)}
          onChange={(v) => onUpdate("minimumStayMonths", Number(v))}
        />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-(--palette-border) bg-(--palette-section-bg) p-4">
        <Sparkles className="h-5 w-5 flex-shrink-0 text-(--palette-purple)" />
        <div>
          <p className="text-sm font-semibold text-(--palette-deep)">
            Ready to find matches
          </p>
          <p className="text-xs text-(--palette-soft-purple)">
            Click "Save & Find Matches" to compute mutual compatibility scores.
          </p>
        </div>
      </div>
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = step === 4;
  const isFirstStep = step === 1;

  return (
    <div className="overflow-hidden rounded-[28px] border border-(--palette-border) bg-(--palette-card-bg) shadow-sm">
      {/* Step tabs */}
      <div className="flex border-b border-(--palette-border) bg-(--palette-section-bg)">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const isActive = step === n;
          const isDone = step > n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-2 py-3 transition ${
                isActive
                  ? "border-(--palette-purple) bg-(--palette-card-bg)"
                  : "border-transparent hover:bg-(--palette-card-bg)/50"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-(--palette-purple) text-white"
                      : "border border-(--palette-border) bg-(--palette-section-bg) text-(--palette-soft-purple)"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : n}
              </div>
              <span
                className={`hidden text-[11px] font-semibold sm:block ${
                  isActive
                    ? "text-(--palette-deep)"
                    : "text-(--palette-soft-purple)"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step body */}
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {stepContent[step - 1]()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-(--palette-border) bg-(--palette-section-bg) px-5 py-4">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                n === step
                  ? "w-5 bg-(--palette-purple)"
                  : n < step
                    ? "w-1.5 bg-green-500"
                    : "w-1.5 bg-(--palette-border)"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              type="button"
              onClick={() =>
                setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)
              }
              className="rounded-xl border border-(--palette-border) px-4 py-2 text-sm font-semibold text-(--palette-deep) transition hover:bg-(--palette-section-bg)"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-xl bg-(--palette-chip-bg) px-4 py-2 text-sm font-semibold text-(--palette-deep) transition hover:opacity-80 disabled:opacity-50"
          >
            Save
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={onSaveAndRecompute}
              disabled={isSaving || isComputing}
              className="rounded-xl bg-(--palette-purple) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isComputing ? "Finding matches…" : "Save & Find Matches"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4)
              }
              className="rounded-xl bg-(--palette-purple) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
