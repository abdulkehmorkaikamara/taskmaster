// src/components/InviteModal.js
import React, { useState } from "react";
import { X } from 'lucide-react';
import "./InviteModal.css";

export default function InviteModal({ listId, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
        const errorData = await res.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Invite failed');
      }

      onInvited(email, role);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite to List</h2>
          <button className="btn close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invite-email">Email address</label>
            <input
              id="invite-email"
              type="email"
              required
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="editor">Editor (can modify)</option>
            </select>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}