import { Ban, Trash2 } from "lucide-react";
import BentoCard from "./layout/BentoCard";
import AdminPagination from "./ui/AdminPagination";
import { TypeChip, StatusChip } from "./ui/Chips";
import type { AdminPaginationMeta } from "../lib/pagination";
import { adminPalette } from "../theme/palette";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  type?: string;
  role: string;
  joined: string;
  status?: string;
  reason?: string | null;
}

const UserTable: React.FC<{
  users: UserRow[];
  onBlock: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  title: string;
  pagination: AdminPaginationMeta;
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ users, onBlock, onDelete, title, pagination, onPageChange, loading }) => {
  if (users.length === 0) {
    return (
      <BentoCard label={title}>
        <div className="px-5 py-10 text-center text-sm" style={{ color: adminPalette.muted }}>
          No users match your search. Try a different filter or query.
        </div>
        <AdminPagination
          pagination={pagination}
          currentCount={0}
          onPageChange={onPageChange}
          loading={loading}
        />
      </BentoCard>
    );
  }

  return (
    <BentoCard
      label={title}
      action={
        <span className="text-xs font-semibold" style={{ color: adminPalette.muted }}>
          Page {pagination.page} of {pagination.totalPages}
        </span>
      }
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr
              className="border-b text-left text-[11px] font-semibold uppercase tracking-wider"
              style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
            >
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const displayType = u.role === "admin" ? "Admin" : u.type ?? "Tenant";
              const statusLabel = u.status ?? "Active";

              return (
                <tr
                  key={u.id}
                  className="border-b transition-colors hover:bg-[#f8fafc]"
                  style={{ borderColor: adminPalette.border }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: adminPalette.deep }}
                      >
                        {u.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                      <span className="font-semibold" style={{ color: adminPalette.deep }}>
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                    {u.email}
                  </td>
                  <td className="px-5 py-4">
                    <TypeChip type={displayType} />
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: adminPalette.muted }}>
                    {u.joined || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusChip status={statusLabel} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onDelete(u)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#fef2f2]"
                        style={{
                          borderColor: "#fecaca",
                          color: adminPalette.accent,
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => onBlock(u)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f8fafc]"
                          style={{
                            borderColor: adminPalette.border,
                            color: adminPalette.deep,
                          }}
                        >
                          <Ban size={12} />
                          {statusLabel === "Blocked" ? "Unblock" : "Block"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden" style={{ borderColor: adminPalette.border }}>
        {users.map((u) => {
          const displayType = u.role === "admin" ? "Admin" : u.type ?? "Tenant";
          const statusLabel = u.status ?? "Active";

          return (
            <article key={u.id} className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: adminPalette.deep }}
                >
                  {u.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                <div>
                  <p className="font-semibold" style={{ color: adminPalette.deep }}>
                    {u.name}
                  </p>
                  <p className="text-xs" style={{ color: adminPalette.muted }}>
                    {u.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <TypeChip type={displayType} />
                <StatusChip status={statusLabel} />
              </div>
              <p className="text-xs" style={{ color: adminPalette.muted }}>
                Joined {u.joined || "—"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(u)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold"
                  style={{ borderColor: "#fecaca", color: adminPalette.accent }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                {u.role !== "admin" && (
                  <button
                    type="button"
                    onClick={() => onBlock(u)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold"
                    style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
                  >
                    <Ban size={12} />
                    {statusLabel === "Blocked" ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <AdminPagination
        pagination={pagination}
        currentCount={users.length}
        onPageChange={onPageChange}
        loading={loading}
      />
    </BentoCard>
  );
};

export default UserTable;
