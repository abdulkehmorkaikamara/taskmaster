// src/components/ShareListModal.js
import React, { useState } from 'react';
export default function ShareListModal({ listId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('viewer');
      const handleShare = async () => {
      await fetch(
      `${process.env.REACT_APP_SERVERURL}/lists/${listId}/invite`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',           // ← this is critical
        body:        JSON.stringify({ email, role })
      }
    )

    await fetch(
  `${process.env.REACT_APP_SERVERURL}/lists/${listId}/invite`,
    {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',           // ← this is critical
      body:        JSON.stringify({ email, role })
    }
)

    onClose();
  };
  return (
    <div className="overlay">
      <div className="modal">
        <h2>Invite collaborator</h2>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Role
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </label>
        <button onClick={handleShare} className="btn save">Invite</button>
        <button onClick={onClose} className="btn cancel">Cancel</button>
      </div>
    </div>
  );
}
