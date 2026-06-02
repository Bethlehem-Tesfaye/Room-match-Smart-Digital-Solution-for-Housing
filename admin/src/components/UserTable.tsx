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
    <div className="admin-surface">
      <div className="admin-surface-head">
        <p className="admin-mono-label">User Management</p>
      </div>

      <div className="admin-table-wrap">
        <table className="user-table">
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
                <td className="user-cell">
                  <div className="avatar">{u.name?.[0]?.toUpperCase() ?? "U"}</div>
                  <div className="user-name">{u.name}</div>
                </td>
                <td>{u.email}</td>
                <td>{u.role === "admin" ? "Admin" : u.type ?? "-"}</td>
                <td>
                  <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                    {u.role}
                  </span>
                </td>
                <td>{u.joined}</td>
                <td>{u.status ?? "Active"}</td>
                <td>{u.reason || "-"}</td>
                <td className="table-actions">
                  <button
                    className="ghost-danger"
                    onClick={() => onDelete(u)}
                    title={`Delete ${u.role === "admin" ? "admin" : "user"} ${u.name}`}
                  >
                    Delete
                  </button>
                  {u.role !== "admin" && (
                    <button className="ghost-warn" onClick={() => onBlock(u)}>
                      {u.status === "Blocked" ? "Unblock" : "Block"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-user-cards">
        {users.map((u) => (
          <article key={u.id} className="admin-user-card">
            <div className="user-cell">
              <div className="avatar">{u.name?.[0]?.toUpperCase() ?? "U"}</div>
              <div>
                <p className="user-name">{u.name}</p>
                <p className="user-meta">{u.email}</p>
              </div>
            </div>
            <p className="user-meta">Type: {u.role === "admin" ? "Admin" : u.type ?? "-"}</p>
            <p className="user-meta">Role: {u.role}</p>
            <p className="user-meta">Joined: {u.joined}</p>
            <p className="user-meta">Status: {u.status ?? "Active"}</p>
            <p className="user-meta">Reason: {u.reason || "-"}</p>
            <div className="table-actions">
              <button className="ghost-danger" onClick={() => onDelete(u)}>
                Delete
              </button>
              {u.role !== "admin" && (
                <button className="ghost-warn" onClick={() => onBlock(u)}>
                  {u.status === "Blocked" ? "Unblock" : "Block"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default UserTable;
