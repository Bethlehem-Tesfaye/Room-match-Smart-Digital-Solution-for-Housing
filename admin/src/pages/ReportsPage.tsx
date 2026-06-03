import { useCallback, useEffect, useState } from "react";
import { getAdminReports, AdminReport } from "../lib/api";
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

function ReportStatusChip({ isRead }: { isRead: boolean }) {
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

function ReportsPage() {
  const { clearReportNotifications } = useAdminNotifications();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(defaultPagination);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminReports({
        page,
        limit: ADMIN_PAGE_SIZE,
      });
      setReports(response.reports ?? []);
      setPagination(response.pagination ?? defaultPagination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void clearReportNotifications().catch(() => undefined);
  }, [clearReportNotifications]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <AdminShell
      eyebrow="Admin · Reports"
      title="Unblock requests"
      subtitle="Review appeal messages from blocked users."
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

      {loading && reports.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          Loading reports…
        </div>
      ) : reports.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          No unblock reports have been submitted yet.
        </div>
      ) : (
        <BentoCard
          label="Report queue"
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
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b align-top transition-colors hover:bg-[#f8fafc]"
                    style={{ borderColor: adminPalette.border }}
                  >
                    <td
                      className="px-5 py-4 text-sm whitespace-nowrap"
                      style={{ color: adminPalette.muted }}
                    >
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: adminPalette.deep }}>
                      {report.title}
                    </td>
                    <td className="max-w-md px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                      {report.content}
                    </td>
                    <td className="px-5 py-4">
                      <ReportStatusChip isRead={report.isRead} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden" style={{ borderColor: adminPalette.border }}>
            {reports.map((report) => (
              <article key={report.id} className="space-y-2 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold" style={{ color: adminPalette.deep }}>
                    {report.title}
                  </p>
                  <ReportStatusChip isRead={report.isRead} />
                </div>
                <p className="text-sm" style={{ color: adminPalette.muted }}>
                  {report.content}
                </p>
                <p className="text-xs" style={{ color: adminPalette.muted }}>
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>

          <AdminPagination
            pagination={pagination}
            currentCount={reports.length}
            onPageChange={setPage}
            loading={loading}
          />
        </BentoCard>
      )}
    </AdminShell>
  );
}

export default ReportsPage;
