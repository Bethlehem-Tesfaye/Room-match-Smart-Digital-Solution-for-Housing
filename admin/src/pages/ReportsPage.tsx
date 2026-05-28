import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminReports, AdminReport } from "../lib/api";

function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);

      try {
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
          <p className="hero-sub">Review unblock requests from blocked users and take action.</p>
          <div className="mt-4">
            <Link to="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          {error && <div className="dashboard-error">{error}</div>}
          {loading ? (
            <div className="dashboard-placeholder">Loading incoming reports…</div>
          ) : reports.length === 0 ? (
            <div className="dashboard-placeholder">No unblock reports have been submitted yet.</div>
          ) : (
            <div className="table-card">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Requested At</th>
                    <th>Title</th>
                    <th>Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{new Date(report.createdAt).toLocaleString()}</td>
                      <td>{report.title}</td>
                      <td>{report.content}</td>
                      <td>{report.isRead ? "Read" : "Unread"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;
