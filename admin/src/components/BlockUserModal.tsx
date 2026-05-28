import React, { useState } from "react";
import type { UserRow } from "./UserTable";

const BlockUserModal: React.FC<{
  user?: UserRow | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}> = ({ user, open, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  if (!open || !user) return null;
  const isBlocked = user.status === "Blocked";

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>{isBlocked ? "Unblock User" : "Block User"}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-user">
            <div className="avatar large">{user.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="modal-name">{user.name}</div>
              <div className="modal-email">{user.email}</div>
            </div>
          </div>

          <label>Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isBlocked ? "Why are you unblocking this user?" : "Why are you blocking this user?"}
          />
          <p className="hint">
            {isBlocked
              ? "Unblocked users regain access immediately."
              : "Blocked users are flagged in the system. You can unblock them at any time."}
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn danger" onClick={() => onConfirm(reason)}>
            {isBlocked ? "Unblock User" : "Block User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
