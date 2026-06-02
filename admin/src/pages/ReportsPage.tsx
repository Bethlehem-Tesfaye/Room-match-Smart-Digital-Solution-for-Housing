import React, { useEffect, useState } from "react";
import { getAdminReports, AdminReport } from "../lib/api";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import AdminNavTabs from "../components/AdminNavTabs";

// Helper component to display clean, visual status chips for appeal records
function ReportStatusBadge({ isRead }: { isRead: boolean }) {
  const baseStyle: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.82rem",
    fontWeight: "600",
    display: "inline-block",
    textAlign: "center",
  };

  if (!isRead) {
    return <span style={{ ...baseStyle, backgroundColor: "#fef7e0", color: "#b06000" }}>⚠️ Unread</span>;
  }

  return <span style={{ ...baseStyle, backgroundColor: "#e6f4ea", color: "#137333" }}>✅ Read</span>;
}

function ReportsPage() {
  const { clearReportNotifications } = useAdminNotifications();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);

      try {
        await clearReportNotifications();
        const response = await getAdminReports();
        setReports(response.reports ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <h1 className="hero-title">Incoming Block Reports</h1>
          <p className="hero-sub">
            Review unblock requests and clear them from the badge once viewed.
          </p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <div className="tabs">
            <AdminNavTabs />
          </div>

          {error && <div className="alert">{error}</div>}

          {loading ? (
            <div className="admin-empty">Loading incoming appeal reports...</div>
          ) : reports.length === 0 ? (
            <div className="admin-empty">No unblock reports have been submitted yet.</div>
          ) : (
            <div className="admin-surface">
              <div className="admin-surface-head">
                <p className="admin-mono-label">Report Queue</p>
              </div>
              <div className="admin-table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Requested At</th>
                      <th>Title</th>
                      <th>Details / Appeal Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{new Date(report.createdAt).toLocaleString()}</td>
                        <td>{report.title}</td>
                        <td>{report.content}</td>
                        <td>
                          <ReportStatusBadge isRead={report.isRead} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-user-cards">
                {reports.map((report) => (
                  <article key={report.id} className="admin-user-card">
                    <p className="user-name">{report.title}</p>
                    <p className="user-meta">{report.content}</p>
                    <p className="user-meta">
                      Requested: {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <ReportStatusBadge isRead={report.isRead} />
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;