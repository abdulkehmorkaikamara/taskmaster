// src/components/InviteModal.js
import React, { useState } from "react";
import "./InviteModal.css";

export default function InviteModal({ listId, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/lists/${listId}/invite`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role })
        }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      onInvited(email, role);
      onClose();
    } catch (err) {
      setError(err.message || "Invite failed");
    }
  };

  return (
    <div className="overlay">
      <div className="invite-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Invite to List</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="editor">Editor (can modify)</option>
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn save">Send Invite</button>
        </form>
      </div>
    </div>
  );
}
