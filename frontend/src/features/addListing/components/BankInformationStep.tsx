import { Landmark } from "lucide-react";
import { palette } from "../../../theme/palette";
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

function BankInformationStep({
  bankInfo,
  banks,
  hasExistingBankAccount,
  isLoadingBanks,
  errors,
  onChangeField,
}: BankInformationStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div
          className="mb-1 flex items-center gap-2 text-lg font-semibold"
          style={{ color: palette.deep }}
        >
          <Landmark size={18} style={{ color: palette.purple }} />
          Bank Information
        </div>
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Add the bank account that will receive your rental payments
        </p>
      </div>

      {hasExistingBankAccount ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.chipBg,
            color: palette.deep,
          }}
        >
          Is this the bank account you want to receive payments to? You can
          still edit the details before confirming.
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Account Name *
        </label>
        <input
          value={bankInfo.accountName}
          onChange={(event) => onChangeField("accountName", event.target.value)}
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor: errors.accountName ? "rgb(220 38 38)" : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="e.g., Abebe Bekele"
        />
        {errors.accountName ? (
          <p className="text-sm text-red-600">{errors.accountName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Account Number *
        </label>
        <input
          value={bankInfo.accountNumber}
          onChange={(event) =>
            onChangeField(
              "accountNumber",
              event.target.value.replace(/[^\d]/g, ""),
            )
          }
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor: errors.accountNumber
              ? "rgb(220 38 38)"
              : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          placeholder="1234567890"
        />
        {errors.accountNumber ? (
          <p className="text-sm text-red-600">{errors.accountNumber}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold"
          style={{ color: palette.deep }}
        >
          Bank Name *
        </label>
        <select
          value={bankInfo.bankCode}
          onChange={(event) => {
            const selectedBank = banks.find(
              (bank) => bank.id === event.target.value,
            );
            onChangeField("bankCode", event.target.value);
            onChangeField(
              "bankName",
              selectedBank?.name ??
                event.currentTarget.selectedOptions[0]?.textContent?.trim() ??
                "",
            );
          }}
          className="w-full rounded-lg border px-4 py-2 outline-none"
          style={{
            borderColor:
              errors.bankCode || errors.bankName
                ? "rgb(220 38 38)"
                : palette.border,
            backgroundColor: palette.inputBg,
            color: palette.deep,
          }}
          disabled={isLoadingBanks}
        >
          <option value="">
            {isLoadingBanks ? "Loading banks..." : "Select a bank"}
          </option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
        {errors.bankCode || errors.bankName ? (
          <p className="text-sm text-red-600">
            {errors.bankCode || errors.bankName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default BankInformationStep;
