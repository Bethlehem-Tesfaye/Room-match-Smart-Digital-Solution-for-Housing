import { Link, useLocation } from "react-router-dom";
import { useAdminNotifications } from "../context/AdminNotificationContext";

type AdminNavTabsProps = {
  propertiesCount?: number | string;
};

function AdminNavTabs({ propertiesCount }: AdminNavTabsProps) {
  const location = useLocation();
  const { counts } = useAdminNotifications();
  const onProperties = location.pathname.startsWith("/dashboard/properties");
  const onReports = location.pathname.startsWith("/dashboard/reports");

  return (
    <div className="admin-nav-tabs">
      <Link
        to="/dashboard/properties"
        className={`tab-link ${onProperties ? "active" : ""}`}
      >
        <span>Properties ({propertiesCount ?? "..."})</span>
        {counts.propertyNotifications > 0 && (
          <span className="tab-badge">{counts.propertyNotifications}</span>
        )}
      </Link>

      <Link to="/dashboard/reports" className={`tab-link ${onReports ? "active" : ""}`}>
        <span>Reports</span>
        {counts.reportNotifications > 0 && (
          <span className="tab-badge">{counts.reportNotifications}</span>
        )}
      </Link>
    </div>
  );
}

export default AdminNavTabs;
