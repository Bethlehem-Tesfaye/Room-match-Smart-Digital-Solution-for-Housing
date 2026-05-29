import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminReports, AdminReport } from "../lib/api";

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
      <header className="dashboard-hero" style={{ padding: "24px 0" }}>
        <div className="dashboard-inner" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>🚨</span>
            <h1 className="hero-title" style={{ margin: 0, fontSize: "1.75rem" }}>Incoming Block Reports</h1>
          </div>
          <p className="hero-sub" style={{ margin: "4px 0 0 0", opacity: 0.8, fontSize: "0.95rem" }}>
            Review unblock requests from blocked users and take action.
          </p>
       <div style={{ marginTop: "12px", width: "auto", display: "block" }}>
            <Link 
              to="/dashboard" 
              className="button"
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px",
                padding: "8px 16px",
                fontSize: "0.88rem",
                backgroundColor: "#4f46e5",
                borderRadius: "6px",
                textDecoration: "none",
                color: "#ffffff",
                fontWeight: "500",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                width: "max-content", // Forces button size to only fit its words
                flexGrow: 0,          // Guarantees it won't stretch
                maxWidth: "200px"     // Sets a safety cap width
              }}
            >
              <span>⬅</span> Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          {error && <div className="dashboard-error" style={{ marginBottom: "20px", color: "#dc2626" }}>⚠️ {error}</div>}
          
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "1rem", color: "#888" }}>
              🔄 Loading incoming appeal reports...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "1rem", color: "#6b7280", border: "1px dashed #d1d5db", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
              🎉 No unblock reports have been submitted yet.
            </div>
          ) : (
            /* Clean table container with premium structural border lines */
            <div className="table-card" style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <table className="user-table" style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Requested At</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Title</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Details / Appeal Message</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "14px 16px", fontSize: "0.88rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: "6px", opacity: 0.7 }}>📅</span>
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "0.9rem", fontWeight: "600", color: "#111827" }}>
                        {report.title}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "0.9rem", color: "#4b5563", lineHeight: "1.45" }}>
                        {report.content}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <ReportStatusBadge isRead={report.isRead} />
                      </td>
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