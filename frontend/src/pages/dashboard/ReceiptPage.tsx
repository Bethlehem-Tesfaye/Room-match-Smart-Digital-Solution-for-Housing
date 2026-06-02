import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  CircleDollarSign,
  ReceiptText,
  UserRound,
  Building2,
  Hash,
  CalendarDays,
  Banknote,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/axios";
import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
// import { useIsDark } from "../../hooks/useIsDark";

type ReceiptUser = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
};

type ReceiptPayload = {
  payment: {
    _id: string;
    txRef: string;
    amount: number;
    platformFee: number;
    ownerAmount: number;
    currency: string;
    status: "pending" | "success" | "failed";
    createdAt?: string;
    updatedAt?: string;
  };
  contract: {
    _id: string;
    status: string;
    createdAt?: string;
    acceptedAt?: string | null;
    paymentDueAt?: string | null;
    tenantId?: ReceiptUser | string;
    ownerId?: ReceiptUser | string;
    listingId?: {
      _id: string;
      title?: string;
      city?: string;
      address?: string;
      price?: number;
      currency?: string;
    } | null;
  };
  listing?: {
    _id: string;
    title?: string;
    city?: string;
    address?: string;
    price?: number;
    currency?: string;
  } | null;
  tenant?: ReceiptUser | string;
  owner?: ReceiptUser | string;
};

const getUserLabel = (user?: ReceiptUser | string | null) => {
  if (!user) return "Unavailable";
  if (typeof user === "string") return user;
  return user.name || user.email || user._id;
};

const getUserEmail = (user?: ReceiptUser | string | null) => {
  if (!user || typeof user === "string") return "Email unavailable";
  return user.email || "Email unavailable";
};

const isReceiptUser = (
  value: ReceiptUser | string | null | undefined,
): value is ReceiptUser => {
  return typeof value === "object" && value !== null;
};

const formatMoney = (amount?: number, currency?: string) => {
  if (amount == null) return "Unavailable";
  return `${new Intl.NumberFormat().format(amount)} ${currency || "ETB"}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// ── Payment status badge ──────────────────────────────────────────────────────
function PaymentStatusBadge({ status }: { status?: string }) {
  const cfg =
    status === "success"
      ? {
          bg: "#e6f9f0",
          border: "#86efac",
          color: "#166534",
          label: "Payment successful",
        }
      : status === "failed"
        ? {
            bg: "#fff1f2",
            border: "#fecaca",
            color: "#dc2626",
            label: "Payment failed",
          }
        : {
            bg: "#fef9ec",
            border: "#fcd34d",
            color: "#92400e",
            label: "Pending",
          };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        color: cfg.color,
      }}
    >
      <ReceiptText size={10} />
      {cfg.label}
    </span>
  );
}

// ── Contract status badge ─────────────────────────────────────────────────────
function ContractStatusBadge({ status }: { status?: string }) {
  return (
    <span
      className="rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: "#f0ebff",
        borderColor: "#c4b5fd",
        color: "#8b64c8",
      }}
    >
      {status || "Unknown"}
    </span>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--palette-border)",
        backgroundColor: "var(--palette-card-bg)",
        boxShadow: "0 1px 4px rgba(46,31,74,0.06)",
      }}
    >
      {/* Header strip */}
      <div
        className="px-4 py-2.5 border-b"
        style={{
          backgroundColor: "var(--palette-card-muted-alt-bg)",
          borderColor: "var(--palette-border)",
        }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          {label}
        </span>
      </div>
      {/* Body */}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Meta row ──────────────────────────────────────────────────────────────────
function MetaRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0"
      style={{ borderColor: "var(--palette-border)" }}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon size={12} style={{ color: "var(--palette-soft-purple)" }} />
        )}
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          {label}
        </span>
      </div>
      <span
        className={`text-right text-sm font-semibold ${mono ? "font-mono text-[11px]" : ""}`}
        style={{ color: "var(--palette-deep)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({
  user,
  fallbackIcon: FallbackIcon,
}: {
  user?: ReceiptUser | string | null;
  fallbackIcon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--palette-chip-bg)" }}
      >
        {isReceiptUser(user) && user.image ? (
          <img
            src={user.image}
            alt={getUserLabel(user)}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <FallbackIcon
            size={15}
            style={{ color: "var(--palette-soft-purple)" }}
          />
        )}
      </div>
      <div className="min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--palette-deep)" }}
        >
          {getUserLabel(user)}
        </p>
        <p
          className="text-sm truncate"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          {getUserEmail(user)}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ReceiptPage() {
  const { contractId } = useParams();
  // const isDark = useIsDark();

  const receiptQuery = useQuery<{ receipt: ReceiptPayload }, Error>({
    queryKey: ["payments", "receipt", contractId],
    enabled: !!contractId,
    queryFn: async () => {
      if (!contractId) throw new Error("Contract id is required");
      const response = await api.get<{ receipt: ReceiptPayload }>(
        `/api/payments/receipt/${contractId}`,
      );
      return response.data;
    },
  });

  const receipt = receiptQuery.data?.receipt;
  const payment = receipt?.payment;
  const contract = receipt?.contract;
  const listing = receipt?.listing || contract?.listingId || null;
  const tenant = receipt?.tenant || contract?.tenantId || null;
  const owner = receipt?.owner || contract?.ownerId || null;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab="rental-requests" />

      <main className="flex-1 px-4 py-10 pt-20">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link
                to="/dashboard/rental-requests"
                className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
                style={{
                  borderColor: "var(--palette-border)",
                  backgroundColor: "var(--palette-card-bg)",
                  color: "var(--palette-deep)",
                }}
                aria-label="Back to rentals"
              >
                <ChevronLeft size={15} />
              </Link>
              <div>
                <p
                  className="mb-1 font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--palette-soft-purple)" }}
                >
                  Owner · Rental management
                </p>
                <h1
                  className="text-2xl font-semibold"
                  style={{ color: "var(--palette-deep)" }}
                >
                  Payment receipt
                </h1>
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: "var(--palette-soft-purple)" }}
                >
                  Full breakdown of this rental payment.
                </p>
              </div>
            </div>
          </div>

          {/* Loading */}
          {receiptQuery.isLoading && (
            <div className="space-y-3">
              <div className="skeleton h-36 rounded-2xl" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="skeleton h-48 rounded-2xl" />
                <div className="skeleton h-48 rounded-2xl" />
              </div>
            </div>
          )}

          {/* Error */}
          {receiptQuery.isError && (
            <div
              className="rounded-2xl border px-6 py-10 text-center text-sm"
              style={{
                borderColor: "var(--palette-border)",
                backgroundColor: "var(--palette-card-bg)",
                color: "var(--palette-soft-purple)",
              }}
            >
              {receiptQuery.error.message}
            </div>
          )}

          {/* Receipt */}
          {receipt && (
            <div className="space-y-4">
              {/* ── Top summary card ── */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  borderColor: "var(--palette-border)",
                  backgroundColor: "var(--palette-card-bg)",
                  boxShadow: "0 1px 4px rgba(46,31,74,0.06)",
                }}
              >
                {/* Header strip */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{
                    backgroundColor: "var(--palette-card-muted-alt-bg)",
                    borderColor: "var(--palette-border)",
                  }}
                >
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "var(--palette-soft-purple)" }}
                  >
                    Receipt overview
                  </span>
                  <PaymentStatusBadge status={payment?.status} />
                </div>

                {/* Body */}
                <div className="p-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2
                        size={14}
                        style={{ color: "var(--palette-soft-purple)" }}
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--palette-deep)" }}
                      >
                        {listing?.title || "Rental receipt"}
                      </p>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      {[listing?.city, listing?.address]
                        .filter(Boolean)
                        .join(", ") || "Location unavailable"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      Total amount
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#8b64c8" }}
                    >
                      {formatMoney(payment?.amount, payment?.currency)}
                    </p>
                  </div>
                </div>

                {/* Footer strip */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-t"
                  style={{ borderColor: "var(--palette-border)" }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--palette-soft-purple)" }}
                  >
                    Contract ID:{" "}
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: "var(--palette-deep)" }}
                    >
                      {contract?._id || contractId || "—"}
                    </span>
                  </span>
                  <ContractStatusBadge status={contract?.status} />
                </div>
              </div>

              {/* ── Two-column grid ── */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Left col */}
                <div className="space-y-4">
                  {/* Payment breakdown */}
                  <SectionCard label="Payment breakdown">
                    <MetaRow
                      icon={Banknote}
                      label="Amount paid"
                      value={formatMoney(payment?.amount, payment?.currency)}
                    />
                    <MetaRow
                      icon={Banknote}
                      label="Platform fee"
                      value={formatMoney(
                        payment?.platformFee,
                        payment?.currency,
                      )}
                    />
                    <MetaRow
                      icon={Banknote}
                      label="Owner share"
                      value={formatMoney(
                        payment?.ownerAmount,
                        payment?.currency,
                      )}
                    />
                  </SectionCard>

                  {/* Payment metadata */}
                  <SectionCard label="Payment metadata">
                    <MetaRow
                      icon={Hash}
                      label="Transaction ref"
                      value={payment?.txRef || "Unavailable"}
                      mono
                    />
                    <MetaRow
                      icon={CalendarDays}
                      label="Created"
                      value={formatDateTime(payment?.createdAt)}
                    />
                    <MetaRow
                      icon={CalendarDays}
                      label="Updated"
                      value={formatDateTime(payment?.updatedAt)}
                    />
                  </SectionCard>
                </div>

                {/* Right col */}
                <div className="space-y-4">
                  {/* Tenant */}
                  <SectionCard label="Tenant">
                    <UserRow user={tenant} fallbackIcon={UserRound} />
                  </SectionCard>

                  {/* Owner */}
                  <SectionCard label="Owner / landlord">
                    <UserRow user={owner} fallbackIcon={CircleDollarSign} />
                  </SectionCard>

                  {/* Note */}
                  <SectionCard label="Note">
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "var(--palette-soft-purple)",
                        lineHeight: 1.7,
                      }}
                    >
                      This receipt is generated from the payment collection.
                      Downloadable invoice actions will be available in a future
                      update.
                    </p>
                  </SectionCard>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default ReceiptPage;
