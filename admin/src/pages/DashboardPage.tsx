import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatsCards from "../components/StatsCards";
import SearchBar, { SearchFilter } from "../components/SearchBar";
import UserTable, { UserRow } from "../components/UserTable";
import BlockUserModal from "../components/BlockUserModal";
import {
  getAdminDashboardSummary,
  getAdminUsers,
  setUserBlockedStatus,
  deleteAdminUser,
  signOutAdmin,
} from "../lib/api";

const defaultStats = {
  totalUsers: 0,
  owners: 0,
  tenants: 0,
  properties: 0,
  activeListings: 0,
  roommateProfiles: 0
};

function DashboardPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<"users" | "admins">("users");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statsData, setStatsData] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchFilter>("all");

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      setError(null);

      try {
        const summary = await getAdminDashboardSummary();
        setStatsData(summary);

        const usersResponse = await getAdminUsers();
        setUsers(usersResponse.users ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load admin dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    void loadAdminData();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Users", value: statsData.totalUsers },
      { label: "Owners", value: statsData.owners },
      { label: "Tenants", value: statsData.tenants },
      { label: "Properties", value: statsData.properties },
      { label: "Active Listings", value: statsData.activeListings },
      { label: "Roommate Profiles", value: statsData.roommateProfiles }
    ],
    [statsData]
  );

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOutAdmin();
      navigate("/login", { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed. Please try again.");
    }
  };

  const handleBlockClick = (user: UserRow) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleConfirmBlock = async (reason?: string) => {
    if (!selectedUser) return;

    const blocked = selectedUser.status !== "Blocked";
    try {
      const result = await setUserBlockedStatus(selectedUser.id, blocked, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                status: blocked ? "Blocked" : "Active",
                reason: blocked ? result.reason || reason || "No reason provided." : null
              }
            : u,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user status.");
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    const confirmText = `Are you sure you want to permanently delete ${user.name} (${user.role})? This cannot be undone.`;
    if (!window.confirm(confirmText)) return;

    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();

    switch (filter) {
      case "name":
        return u.name.toLowerCase().includes(q);
      case "email":
        return u.email.toLowerCase().includes(q);
      case "type":
        return u.type?.toLowerCase().includes(q) ?? false;
      case "status":
        return u.status?.toLowerCase().includes(q) ?? false;
      case "joined":
        return u.joined.toLowerCase().includes(q);
      default:
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.type?.toLowerCase().includes(q) ||
          u.status?.toLowerCase().includes(q) ||
          u.joined.toLowerCase().includes(q)
        );
    }
  });

  const adminUsers = useMemo(
    () => filtered.filter((u) => u.role === "admin"),
    [filtered]
  );

  const normalUsers = useMemo(
    () => filtered.filter((u) => u.role !== "admin"),
    [filtered]
  );

  const currentViewUsers = activeUserTab === "admins" ? adminUsers : normalUsers;

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <div className="dashboard-header-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h1 className="hero-title">Admin Dashboard</h1>
              <p className="hero-sub">Manage users, properties, and roommate profiles</p>
            </div>
            <button className="button logout-button" onClick={handleLogout} style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}>
              Logout
            </button>
          </div>
          <StatsCards items={stats} />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <SearchBar value={search} onChange={setSearch} filter={filter} onFilterChange={setFilter} />

          <div className="tabs">
            <button className={`tab ${activeUserTab === "users" ? "active" : ""}`} onClick={() => setActiveUserTab("users")}>Users ({loading ? "..." : normalUsers.length})</button>
            <button className={`tab ${activeUserTab === "admins" ? "active" : ""}`} onClick={() => setActiveUserTab("admins")}>Admins ({loading ? "..." : adminUsers.length})</button>
            <button className="tab"><Link to="/dashboard/properties">Properties ({loading ? "..." : statsData.properties})</Link></button>
            <button className="tab">Roommates ({loading ? "..." : statsData.roommateProfiles})</button>
            <button className="tab">
              <Link to="/dashboard/reports">Reports</Link>
            </button>
          </div>

          {error && <div className="dashboard-error">{error}</div>}
          {loading && users.length === 0 ? (
            <div className="dashboard-placeholder">Loading latest admin data…</div>
          ) : (
            <UserTable users={currentViewUsers} onBlock={handleBlockClick} onDelete={handleDeleteUser} />
          )}
        </div>
      </main>

      <BlockUserModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmBlock}
      />
    </div>
  );
}

export default DashboardPage;
