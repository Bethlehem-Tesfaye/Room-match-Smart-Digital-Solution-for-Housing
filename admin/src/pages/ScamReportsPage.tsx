import { useCallback, useEffect, useState } from "react";
import {
  getAdminScamReport,
  getAdminScamReports,
  type AdminScamReport,
} from "../lib/api";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import AdminShell from "../components/layout/AdminShell";
import BentoCard from "../components/layout/BentoCard";
import AdminPagination from "../components/ui/AdminPagination";
import ReportedUserModal from "../components/ReportedUserModal";
import {
  ADMIN_PAGE_SIZE,
  defaultPagination,
  type AdminPaginationMeta,
} from "../lib/pagination";
import { adminPalette } from "../theme/palette";

const REASON_LABELS: Record<string, string> = {
  scam_or_fraud: "Scam or fraud",
  spam: "Spam",
  misleading_listing: "Misleading listing",
  inappropriate_content: "Inappropriate content",
  harassment: "Harassment",
  impersonation: "Impersonation",
  other: "Other",
};

function formatReason(reason: string) {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}

function ScamReportsPage() {
  const { clearScamReportNotifications } = useAdminNotifications();
  const [reports, setReports] = useState<AdminScamReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminScamReport | null>(
    null,
  );
  const [reportedCounts, setReportedCounts] = useState<{
    listingReports: number;
    userReports: number;
    totalReports: number;
  } | null>(null);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [modalUserName, setModalUserName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(defaultPagination);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminScamReports({
        page,
        limit: ADMIN_PAGE_SIZE,
      });
      setReports(response.reports ?? []);
      setPagination(response.pagination ?? defaultPagination());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load scam reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadDetail = useCallback(async (reportId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const response = await getAdminScamReport(reportId);
      setSelectedReport(response.report);
      setReportedCounts(response.reportedCounts ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load report details.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void clearScamReportNotifications().catch(() => undefined);
  }, [clearScamReportNotifications]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedReport(null);
      setReportedCounts(null);
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleSelectReport = (report: AdminScamReport) => {
    setSelectedId(report.id);
  };

  return (
    <AdminShell
      eyebrow="Admin · Trust & safety"
      title="Scam reports"
      subtitle="Listing and messaging reports submitted by users."
    >
      {error && (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: adminPalette.accent,
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <BentoCard
          label="Report queue"
          action={
            <span className="text-xs font-semibold" style={{ color: adminPalette.muted }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          }
        >
          {loading && reports.length === 0 ? (
            <p className="px-4 py-8 text-sm" style={{ color: adminPalette.muted }}>
              Loading reports…
            </p>
          ) : reports.length === 0 ? (
            <p className="px-4 py-8 text-sm" style={{ color: adminPalette.muted }}>
              No scam reports yet.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: adminPalette.border }}>
              {reports.map((report) => {
                const active = selectedId === report.id;
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => handleSelectReport(report)}
                    className="w-full px-4 py-4 text-left transition-colors"
                    style={{
                      backgroundColor: active ? adminPalette.chipBg : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: adminPalette.muted }}
                      >
                        {report.reportType === "listing" ? "Listing" : "User"}
                      </span>
                      <span className="text-xs" style={{ color: adminPalette.muted }}>
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold" style={{ color: adminPalette.deep }}>
                      {formatReason(report.reason)}
                    </p>
                    <p className="mt-0.5 text-sm" style={{ color: adminPalette.muted }}>
                      {report.reporter.name} → {report.reported.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <AdminPagination
            pagination={pagination}
            currentCount={reports.length}
            onPageChange={setPage}
            loading={loading}
          />
        </BentoCard>

        <BentoCard label="Report details">
          {!selectedId ? (
            <p className="px-4 py-10 text-sm" style={{ color: adminPalette.muted }}>
              Select a report to view details.
            </p>
          ) : detailLoading && !selectedReport ? (
            <p className="px-4 py-10 text-sm" style={{ color: adminPalette.muted }}>
              Loading details…
            </p>
          ) : selectedReport ? (
            <div className="space-y-4 px-4 py-4 text-sm">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: adminPalette.muted }}
                >
                  Type
                </p>
                <p className="font-semibold capitalize" style={{ color: adminPalette.deep }}>
                  {selectedReport.reportType} report
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-3" style={{ borderColor: adminPalette.border }}>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: adminPalette.muted }}
                  >
                    Reported by
                  </p>
                  <p className="mt-1 font-semibold" style={{ color: adminPalette.deep }}>
                    {selectedReport.reporter.name}
                  </p>
                  <p style={{ color: adminPalette.muted }}>
                    {selectedReport.reporter.email || selectedReport.reporter.userId}
                  </p>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: adminPalette.border }}>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: adminPalette.muted }}
                  >
                    Reported user
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setModalUserId(selectedReport.reported.userId);
                      setModalUserName(selectedReport.reported.name);
                    }}
                    className="mt-1 text-left font-semibold underline-offset-2 hover:underline"
                    style={{ color: adminPalette.accent }}
                  >
                    {selectedReport.reported.name}
                  </button>
                  <p style={{ color: adminPalette.muted }}>
                    {selectedReport.reported.email || selectedReport.reported.userId}
                  </p>
                  {reportedCounts ? (
                    <p className="mt-2 text-xs" style={{ color: adminPalette.muted }}>
                      Prior reports: {reportedCounts.listingReports} listing ·{" "}
                      {reportedCounts.userReports} messaging ·{" "}
                      {reportedCounts.totalReports} total
                    </p>
                  ) : null}
                </div>
              </div>

              {selectedReport.propertyTitle ? (
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: adminPalette.muted }}
                  >
                    Listing
                  </p>
                  <p style={{ color: adminPalette.deep }}>{selectedReport.propertyTitle}</p>
                </div>
              ) : null}

              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: adminPalette.muted }}
                >
                  Reason
                </p>
                <p style={{ color: adminPalette.deep }}>
                  {formatReason(selectedReport.reason)}
                </p>
              </div>

              {selectedReport.description ? (
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: adminPalette.muted }}
                  >
                    Description
                  </p>
                  <p className="whitespace-pre-wrap" style={{ color: adminPalette.deep }}>
                    {selectedReport.description}
                  </p>
                </div>
              ) : null}

              <p className="text-xs" style={{ color: adminPalette.muted }}>
                Submitted {new Date(selectedReport.createdAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </BentoCard>
      </div>

      <ReportedUserModal
        userId={modalUserId}
        userName={modalUserName}
        onClose={() => {
          setModalUserId(null);
          setModalUserName(undefined);
        }}
        onBlocked={() => {
          if (selectedId) void loadDetail(selectedId);
        }}
      />
    </AdminShell>
  );
}

export default ScamReportsPage;
