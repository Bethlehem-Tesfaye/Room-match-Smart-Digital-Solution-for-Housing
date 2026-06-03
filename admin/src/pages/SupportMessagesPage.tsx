import { useCallback, useEffect, useState } from "react";
import { getAdminSupportMessages, AdminSupportMessage } from "../lib/api";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import AdminShell from "../components/layout/AdminShell";
import BentoCard from "../components/layout/BentoCard";
import AdminPagination from "../components/ui/AdminPagination";
import {
  ADMIN_PAGE_SIZE,
  defaultPagination,
  type AdminPaginationMeta,
} from "../lib/pagination";
import { adminPalette } from "../theme/palette";

function MessageStatusChip({ isRead }: { isRead: boolean }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: isRead ? "#dcfce7" : "#fef3c7",
        color: isRead ? "#166534" : "#92400e",
      }}
    >
      {isRead ? "Read" : "Unread"}
    </span>
  );
}

function SupportMessagesPage() {
  const { clearSupportNotifications } = useAdminNotifications();
  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(defaultPagination);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminSupportMessages({
        page,
        limit: ADMIN_PAGE_SIZE,
      });
      setMessages(response.messages ?? []);
      setPagination(response.pagination ?? defaultPagination());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load support messages.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void clearSupportNotifications().catch(() => undefined);
  }, [clearSupportNotifications]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return (
    <AdminShell
      eyebrow="Admin · Support"
      title="Support messages"
      subtitle="Messages from users include email and phone from their profile when available."
    >
      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: adminPalette.accent,
          }}
        >
          {error}
        </div>
      )}

      {loading && messages.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          Loading support messages…
        </div>
      ) : messages.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          No support messages yet.
        </div>
      ) : (
        <BentoCard
          label="Support inbox"
          action={
            <span className="text-xs font-semibold" style={{ color: adminPalette.muted }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          }
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr
                  className="border-b text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
                >
                  <th className="px-5 py-3">Received</th>
                  <th className="px-5 py-3">From</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b align-top transition-colors hover:bg-[#f8fafc]"
                    style={{ borderColor: adminPalette.border }}
                  >
                    <td
                      className="px-5 py-4 text-sm whitespace-nowrap"
                      style={{ color: adminPalette.muted }}
                    >
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: adminPalette.deep }}>
                      {entry.title}
                    </td>
                    <td className="max-w-md px-5 py-4 text-sm whitespace-pre-wrap" style={{ color: adminPalette.muted }}>
                      {entry.content}
                    </td>
                    <td className="px-5 py-4">
                      <MessageStatusChip isRead={entry.isRead} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden" style={{ borderColor: adminPalette.border }}>
            {messages.map((entry) => (
              <article key={entry.id} className="space-y-2 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold" style={{ color: adminPalette.deep }}>
                    {entry.title}
                  </p>
                  <MessageStatusChip isRead={entry.isRead} />
                </div>
                <p className="whitespace-pre-wrap text-sm" style={{ color: adminPalette.muted }}>
                  {entry.content}
                </p>
                <p className="text-xs" style={{ color: adminPalette.muted }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>

          <AdminPagination
            pagination={pagination}
            currentCount={messages.length}
            onPageChange={setPage}
            loading={loading}
          />
        </BentoCard>
      )}
    </AdminShell>
  );
}

export default SupportMessagesPage;
