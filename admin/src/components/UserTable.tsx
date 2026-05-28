import React from "react";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  type?: string;
  role: string;
  joined: string;
  status?: string;
}

const UserTable: React.FC<{
  users: UserRow[];
  onBlock: (user: UserRow) => void;
}> = ({ users, onBlock }) => {
  return (
    <div className="table-card">
      <h3>User Management</h3>
      <table className="user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Type</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="user-cell">
                <div className="avatar">{u.name?.[0]?.toUpperCase() ?? "U"}</div>
                <div>{u.name}</div>
              </td>
              <td>{u.email}</td>
              <td>{u.role === "admin" ? "Admin" : u.type ?? "—"}</td>
              <td>
                <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                  {u.role}
                </span>
              </td>
              <td>{u.joined}</td>
              <td>{u.status ?? "Active"}</td>
              <td>
                {u.role === "admin" ? (
                  <span className="admin-action">—</span>
                ) : (
                  <button className="link-block" onClick={() => onBlock(u)}>
                    {u.status === "Blocked" ? "Unblock" : "Block"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
