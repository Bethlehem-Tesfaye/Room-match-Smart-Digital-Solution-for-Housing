import React from "react";

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
}> = ({ users, onBlock, onDelete }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap');

        .bento-surface {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          font-family: 'Syne', sans-serif;
        }

        .bento-surface-head {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bento-surface-title {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }

        /* ── Table ── */
        .bento-table-wrap {
          overflow-x: auto;
          display: block;
        }

        @media (max-width: 768px) {
          .bento-table-wrap { display: none; }
        }

        .bento-user-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .bento-user-table thead tr {
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .bento-user-table th {
          padding: 10px 16px;
          text-align: left;
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
        }

        .bento-user-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.12s;
        }

        .bento-user-table tbody tr:last-child {
          border-bottom: none;
        }

        .bento-user-table tbody tr:hover {
          background: rgba(255,255,255,0.025);
        }

        .bento-user-table td {
          padding: 12px 16px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          vertical-align: middle;
          white-space: nowrap;
        }

        /* ── User cell ── */
        .bento-user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bento-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .bento-user-name {
          font-weight: 600;
          color: #fff;
          font-size: 13.5px;
        }

        /* ── Badges ── */
        .bento-role-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .bento-role-badge.admin {
          background: rgba(139,92,246,0.15);
          color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.25);
        }

        .bento-role-badge.user {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bento-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
        }

        .bento-status-badge.active {
          background: rgba(16,185,129,0.1);
          color: #34d399;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .bento-status-badge.blocked {
          background: rgba(239,68,68,0.1);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.2);
        }

        .bento-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        /* ── Action buttons ── */
        .bento-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .bento-action-btn {
          padding: 5px 12px;
          border-radius: 7px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .bento-action-btn.danger {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #f87171;
        }

        .bento-action-btn.danger:hover {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.4);
        }

        .bento-action-btn.warn {
          background: rgba(245,158,11,0.08);
          border-color: rgba(245,158,11,0.2);
          color: #fbbf24;
        }

        .bento-action-btn.warn:hover {
          background: rgba(245,158,11,0.18);
          border-color: rgba(245,158,11,0.4);
        }

        /* ── Mobile cards ── */
        .bento-user-cards {
          display: none;
        }

        @media (max-width: 768px) {
          .bento-user-cards {
            display: flex;
            flex-direction: column;
          }
        }

        .bento-user-card {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bento-user-card:last-child {
          border-bottom: none;
        }

        .bento-card-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .bento-card-meta {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }

        .bento-card-meta span {
          color: rgba(255,255,255,0.6);
        }
      `}</style>

      <div className="bento-surface">
        <div className="bento-surface-head">
          <p className="bento-surface-title">User Management</p>
        </div>

        {/* Desktop Table */}
        <div className="bento-table-wrap">
          <table className="bento-user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Type</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="bento-user-cell">
                      <div className="bento-avatar">
                        {u.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <span className="bento-user-name">{u.name}</span>
                    </div>
                  </td>
                  <td
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}
                  >
                    {u.email}
                  </td>
                  <td>{u.role === "admin" ? "Admin" : (u.type ?? "—")}</td>
                  <td>
                    <span
                      className={`bento-role-badge ${u.role === "admin" ? "admin" : "user"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}
                  >
                    {u.joined}
                  </td>
                  <td>
                    <span
                      className={`bento-status-badge ${u.status === "Blocked" ? "blocked" : "active"}`}
                    >
                      <span className="bento-status-dot" />
                      {u.status ?? "Active"}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontStyle: "italic",
                    }}
                  >
                    {u.reason || "—"}
                  </td>
                  <td>
                    <div className="bento-actions">
                      <button
                        className="bento-action-btn danger"
                        onClick={() => onDelete(u)}
                        title={`Delete ${u.name}`}
                      >
                        Delete
                      </button>
                      {u.role !== "admin" && (
                        <button
                          className="bento-action-btn warn"
                          onClick={() => onBlock(u)}
                        >
                          {u.status === "Blocked" ? "Unblock" : "Block"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="bento-user-cards">
          {users.map((u) => (
            <article key={u.id} className="bento-user-card">
              <div className="bento-card-row">
                <div className="bento-user-cell">
                  <div className="bento-avatar">
                    {u.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="bento-user-name" style={{ margin: 0 }}>
                      {u.name}
                    </p>
                    <p
                      className="bento-card-meta"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                      }}
                    >
                      {u.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`bento-status-badge ${u.status === "Blocked" ? "blocked" : "active"}`}
                >
                  <span className="bento-status-dot" />
                  {u.status ?? "Active"}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  className={`bento-role-badge ${u.role === "admin" ? "admin" : "user"}`}
                >
                  {u.role}
                </span>
                {u.type && u.role !== "admin" && (
                  <span className="bento-role-badge user">{u.type}</span>
                )}
              </div>

              <p className="bento-card-meta">
                Joined: <span>{u.joined}</span>
              </p>
              {u.reason && (
                <p className="bento-card-meta">
                  Reason: <span>{u.reason}</span>
                </p>
              )}

              <div className="bento-actions">
                <button
                  className="bento-action-btn danger"
                  onClick={() => onDelete(u)}
                >
                  Delete
                </button>
                {u.role !== "admin" && (
                  <button
                    className="bento-action-btn warn"
                    onClick={() => onBlock(u)}
                  >
                    {u.status === "Blocked" ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserTable;
