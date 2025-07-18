// src/components/CommentsSection.js
import React, { useState, useEffect } from 'react';

export default function CommentsSection({ taskId, userEmail }) {
  const [comments, setComments] = useState([]);
  const [newText, setNewText]   = useState('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/comments`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(setComments);
  }, [taskId]);

  const post = async () => {
    await fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_email: userEmail, content: newText })
    });
    setNewText('');
    // refresh
    const r = await fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/comments`, { credentials: 'include' });
    setComments(await r.json());
  };

  return (
    <div className="comments-section">
      <h4>Comments</h4>
      {comments.map(c => (
        <div key={c.created_at} className="comment">
          <strong>{c.author_email}</strong> <em>{new Date(c.created_at).toLocaleString()}</em>
          <p>{c.content}</p>
        </div>
      ))}
      <textarea
        placeholder="Add a comment…"
        value={newText}
        onChange={e => setNewText(e.target.value)}
      />
      <button onClick={post} disabled={!newText.trim()}>
        Post
      </button>
    </div>
  );
}
