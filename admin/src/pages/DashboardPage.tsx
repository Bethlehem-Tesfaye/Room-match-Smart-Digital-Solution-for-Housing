import React, { useEffect, useMemo, useState } from "react";
import StatsCards from "../components/StatsCards";
import SearchBar from "../components/SearchBar";
import UserTable, { UserRow } from "../components/UserTable";
import BlockUserModal from "../components/BlockUserModal";
import { getAdminDashboardSummary, getAdminUsers, setUserBlockedStatus } from "../lib/api";

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
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statsData, setStatsData] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleBlockClick = (user: UserRow) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleConfirmBlock = async (reason?: string) => {
    if (!selectedUser) return;

    const blocked = selectedUser.status !== "Blocked";
    try {
      await setUserBlockedStatus(selectedUser.id, blocked);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, status: blocked ? "Blocked" : "Active" } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user status.");
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-hero">
        <div className="dashboard-inner">
          <h1 className="hero-title">Admin Dashboard</h1>
          <p className="hero-sub">Manage users, properties, and roommate profiles</p>
          <StatsCards items={stats} />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container-wide">
          <SearchBar value={search} onChange={setSearch} />

          <div className="tabs">
            <button className="tab active">Users ({loading ? "..." : statsData.totalUsers})</button>
            <button className="tab">Properties ({loading ? "..." : statsData.properties})</button>
            <button className="tab">Roommates ({loading ? "..." : statsData.roommateProfiles})</button>
          </div>

          {error && <div className="dashboard-error">{error}</div>}
          {loading && users.length === 0 ? (
            <div className="dashboard-placeholder">Loading latest admin data…</div>
          ) : (
            <UserTable users={filtered} onBlock={handleBlockClick} />
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
