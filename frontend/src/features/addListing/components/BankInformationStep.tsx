import { Landmark } from "lucide-react";
import type { BankInfoDraft, BankOption } from "../types/types";

interface BankInformationStepProps {
  bankInfo: BankInfoDraft;
  banks: BankOption[];
  hasExistingBankAccount: boolean;
  isLoadingBanks: boolean;
  errors: {
    accountName?: string;
    accountNumber?: string;
    bankCode?: string;
    bankName?: string;
  };
  onChangeField: <K extends keyof BankInfoDraft>(
    key: K,
    value: BankInfoDraft[K],
  ) => void;
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

function BankInformationStep({
  bankInfo,
  banks,
  hasExistingBankAccount,
  isLoadingBanks,
  errors,
  onChangeField,
}: BankInformationStepProps) {
  const inputStyle = (hasError?: boolean) => ({
    borderColor: hasError ? "#dc2626" : "var(--palette-border)",
    backgroundColor: "var(--palette-input-bg)",
    color: "var(--palette-deep)",
  });

  return (
    <div className="space-y-5">
      {/* Step intro */}
      <div className="flex items-center gap-2">
        <Landmark size={15} style={{ color: "#8b64c8" }} />
        <p className="text-sm" style={{ color: "var(--palette-soft-purple)" }}>
          Add the bank account that will receive your rental payments.
        </p>
      </div>

      {hasExistingBankAccount && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-chip-bg)",
            color: "var(--palette-deep)",
          }}
        >
          You already have a bank account on file. You can still update the
          details before confirming.
        </div>
      )}

      <Field label="Account name *" error={errors.accountName}>
        <input
          value={bankInfo.accountName}
          onChange={(e) => onChangeField("accountName", e.target.value)}
          placeholder="e.g., Abebe Bekele"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={inputStyle(!!errors.accountName)}
        />
      </Field>

      <Field label="Account number *" error={errors.accountNumber}>
        <input
          value={bankInfo.accountNumber}
          onChange={(e) =>
            onChangeField("accountNumber", e.target.value.replace(/[^\d]/g, ""))
          }
          placeholder="1234567890"
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={inputStyle(!!errors.accountNumber)}
        />
      </Field>

      <Field label="Bank name *" error={errors.bankCode || errors.bankName}>
        <select
          value={bankInfo.bankCode}
          onChange={(e) => {
            const selectedBank = banks.find((b) => b.id === e.target.value);
            onChangeField("bankCode", e.target.value);
            onChangeField(
              "bankName",
              selectedBank?.name ??
                e.currentTarget.selectedOptions[0]?.textContent?.trim() ??
                "",
            );
          }}
          disabled={isLoadingBanks}
          className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={inputStyle(!!(errors.bankCode || errors.bankName))}
        >
          <option value="">
            {isLoadingBanks ? "Loading banks…" : "Select a bank"}
          </option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

export default BankInformationStep;
