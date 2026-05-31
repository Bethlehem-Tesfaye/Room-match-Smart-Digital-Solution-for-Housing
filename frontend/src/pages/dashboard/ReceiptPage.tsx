import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  CircleDollarSign,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/axios";
import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import { palette } from "../../theme/palette";

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

function ReceiptPage() {
  const { contractId } = useParams();

  const receiptQuery = useQuery<{ receipt: ReceiptPayload }, Error>({
    queryKey: ["payments", "receipt", contractId],
    enabled: !!contractId,
    queryFn: async () => {
      if (!contractId) {
        throw new Error("Contract id is required");
      }

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
      style={{ backgroundColor: palette.pageBg }}
    >
      <DashboardNavbar activeTab="rental-requests" />

      <main className="flex-1 px-4 py-10 pt-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start gap-4">
            <Link
              to="/dashboard/rental-requests"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:opacity-90"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
                color: palette.deep,
              }}
              aria-label="Back to rentals"
            >
              <ChevronLeft size={18} />
            </Link>

            <div>
              <h1
                className="text-3xl font-extrabold"
                style={{ color: palette.deep }}
              >
                Payment Receipt
              </h1>
              <p className="mt-2 text-sm" style={{ color: palette.purple }}>
                Payment details from the receipt collection.
              </p>
            </div>
          </div>

          {receiptQuery.isLoading ? (
            <section
              className="skeleton h-80 rounded-2xl"
              aria-label="Loading receipt"
            />
          ) : receiptQuery.isError ? (
            <section
              className="rounded-2xl border p-6 text-sm"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
                color: palette.softPurple,
              }}
            >
              {receiptQuery.error.message}
            </section>
          ) : (
            <section
              className="overflow-hidden rounded-3xl border"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.cardBg,
              }}
            >
              <div
                className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5"
                style={{ borderColor: palette.border }}
              >
                <div className="space-y-2">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: palette.softPurple }}
                  >
                    Receipt Overview
                  </p>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: palette.deep }}
                  >
                    {listing?.title || "Rental Receipt"}
                  </h2>
                  <p className="text-sm" style={{ color: palette.softPurple }}>
                    {[listing?.city, listing?.address]
                      .filter(Boolean)
                      .join(", ") || "Location unavailable"}
                  </p>
                </div>

                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "#E8F8F0", color: "#0F7A4A" }}
                >
                  <ReceiptText size={14} />
                  {payment?.status || "pending"}
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.pageBg,
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: palette.softPurple }}
                    >
                      Payment amount
                    </p>
                    <p
                      className="mt-2 text-2xl font-bold"
                      style={{ color: palette.deep }}
                    >
                      {formatMoney(payment?.amount, payment?.currency)}
                    </p>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: palette.softPurple }}
                    >
                      Platform fee:{" "}
                      {formatMoney(payment?.platformFee, payment?.currency)}
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: palette.softPurple }}
                    >
                      Owner share:{" "}
                      {formatMoney(payment?.ownerAmount, payment?.currency)}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.pageBg,
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: palette.softPurple }}
                    >
                      Payment metadata
                    </p>
                    <div
                      className="mt-3 space-y-2 text-sm"
                      style={{ color: palette.deep }}
                    >
                      <p>
                        <span className="font-semibold">Transaction ref:</span>{" "}
                        {payment?.txRef || "Unavailable"}
                      </p>
                      <p>
                        <span className="font-semibold">Created:</span>{" "}
                        {formatDateTime(payment?.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Updated:</span>{" "}
                        {formatDateTime(payment?.updatedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Contract:</span>{" "}
                        {contract?._id || contractId || "Unavailable"}
                      </p>
                      <p>
                        <span className="font-semibold">Contract status:</span>{" "}
                        {contract?.status || "Unavailable"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.pageBg,
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: palette.softPurple }}
                    >
                      Tenant
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: palette.chipBg }}
                      >
                        {isReceiptUser(tenant) && tenant.image ? (
                          <img
                            src={tenant.image}
                            alt={getUserLabel(tenant)}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <UserRound
                            size={18}
                            style={{ color: palette.deep }}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: palette.deep }}
                        >
                          {getUserLabel(tenant)}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: palette.softPurple }}
                        >
                          {getUserEmail(tenant)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.pageBg,
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: palette.softPurple }}
                    >
                      Owner
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: palette.chipBg }}
                      >
                        {isReceiptUser(owner) && owner.image ? (
                          <img
                            src={owner.image}
                            alt={getUserLabel(owner)}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <CircleDollarSign
                            size={18}
                            style={{ color: palette.deep }}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: palette.deep }}
                        >
                          {getUserLabel(owner)}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: palette.softPurple }}
                        >
                          {getUserEmail(owner)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.pageBg,
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: palette.softPurple }}
                    >
                      Payment note
                    </p>
                    <p className="mt-2 text-sm" style={{ color: palette.deep }}>
                      This receipt is pulled from the payment collection and
                      will be expanded later with downloadable invoice actions.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default ReceiptPage;
