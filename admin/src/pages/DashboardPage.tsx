import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Eye,
  Home,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";
import SearchBar, { SearchFilter } from "../components/SearchBar";
import UserTable, { UserRow } from "../components/UserTable";
import BlockUserModal from "../components/BlockUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import AdminShell from "../components/layout/AdminShell";
import AdminStatGrid from "../components/layout/AdminStatGrid";
import BentoCard from "../components/layout/BentoCard";
import {
  getAdminDashboardSummary,
  getAdminUsers,
  setUserBlockedStatus,
  deleteAdminUser,
} from "../lib/api";
import {
  ADMIN_PAGE_SIZE,
  defaultPagination,
  type AdminPaginationMeta,
} from "../lib/pagination";
import { adminPalette } from "../theme/palette";

const defaultStats = {
  totalUsers: 0,
  owners: 0,
  tenants: 0,
  properties: 0,
  activeListings: 0,
  roommateProfiles: 0,
  totalAdmins: 0,
};

function DashboardPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<"users" | "admins">("users");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statsData, setStatsData] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(defaultPagination);

  const loadSummary = async () => {
    try {
      const summary = await getAdminDashboardSummary();
      setStatsData({ ...defaultStats, ...summary });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load admin dashboard data.",
      );
    }
  };

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const response = await getAdminUsers({
        page,
        limit: ADMIN_PAGE_SIZE,
        role: activeUserTab === "admins" ? "admin" : "user",
        search: search || undefined,
        searchField: filter,
      });
      setUsers(response.users ?? []);
      setPagination(response.pagination ?? defaultPagination());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load user directory.",
      );
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  }, [page, activeUserTab, search, filter]);

  useEffect(() => {
    void loadSummary();
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [activeUserTab, search, filter]);

  const stats = useMemo(
    () => [
      { label: "Total users", value: statsData.totalUsers, icon: Users },
      { label: "Owners", value: statsData.owners, icon: Home },
      { label: "Tenants", value: statsData.tenants, icon: UsersRound },
      { label: "Properties", value: statsData.properties, icon: Building2 },
      { label: "Active listings", value: statsData.activeListings, icon: Eye },
    ],
    [statsData],
  );

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
                reason: blocked ? result.reason || reason || null : null,
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

  const handleDeleteClick = (user: UserRow) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteAdminUser(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);

      if (users.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadUsers();
        await loadSummary();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabButton = (key: "users" | "admins", label: string, count: number) => {
    const active = activeUserTab === key;
    return (
      <button
        type="button"
        onClick={() => setActiveUserTab(key)}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          borderColor: active ? adminPalette.deep : adminPalette.border,
          backgroundColor: active ? adminPalette.deep : adminPalette.cardBg,
          color: active ? "#fff" : adminPalette.deep,
        }}
      >
        {key === "admins" ? <Shield size={14} /> : <Users size={14} />}
        {label} ({count})
      </button>
    );
  };

  return (
    <AdminShell
      eyebrow="Admin · Users"
      title="User management"
      subtitle="Search, review, block, or remove platform accounts."
    >
      <AdminStatGrid items={stats} loading={loading} />

      <BentoCard label="Search & filter">
        <div className="p-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            filter={filter}
            onFilterChange={(newFilter) => {
              setFilter(newFilter);
              setSearch("");
            }}
            placeholder="Search by name, email, type, or status..."
          />
        </div>
      </BentoCard>

      <div className="flex flex-wrap gap-2">
        {tabButton("users", "Platform users", statsData.totalUsers)}
        {tabButton("admins", "Admins", statsData.totalAdmins ?? 0)}
      </div>

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

      {listLoading && users.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-5 py-12 text-center text-sm"
          style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
        >
          Loading user directory…
        </div>
      ) : (
        <UserTable
          users={users}
          onBlock={(user) => {
            setSelectedUser(user);
            setModalOpen(true);
          }}
          onDelete={handleDeleteClick}
          title={activeUserTab === "admins" ? "Admin accounts" : "Platform users"}
          pagination={pagination}
          onPageChange={setPage}
          loading={listLoading}
        />
      )}

      <BlockUserModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmBlock}
      />

      <DeleteUserModal
        user={userToDelete}
        open={deleteModalOpen}
        loading={deleteLoading}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </AdminShell>
  );
}

export default DashboardPage;
