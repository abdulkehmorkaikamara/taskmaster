// src/components/CommentsSection.js
import React, { useState, useEffect } from 'react';
import './CommentsSection.css';

export default function CommentsSection({ taskId, userEmail }) {
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/comments`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Could not fetch comments.');
        }
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    // Optimistic update: add comment to UI immediately
    const tempId = Date.now(); // Temporary key for React
    const newComment = {
      id: tempId,
      author_email: userEmail,
      content: newText,
      created_at: new Date().toISOString(),
    };
    setComments(prevComments => [...prevComments, newComment]);
    setNewText('');

    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_email: userEmail, content: newText })
      });

      if (!res.ok) {
        throw new Error('Failed to post comment.');
      }
      
      // Refresh the list from the server to get the real data
      const freshData = await res.json();
      setComments(freshData);

    } catch (err) {
      console.error(err);
      // If the post fails, remove the optimistic comment
      setComments(prevComments => prevComments.filter(c => c.id !== tempId));
      // Optionally show an error toast to the user
    }
  };

  const renderContent = () => {
    if (isLoading) return <p>Loading comments...</p>;
    if (error) return <p className="error-message">Error: {error}</p>;
    if (comments.length === 0) return <p className="empty-state">No comments yet.</p>;
    
    return (
      <div className="comment-list">
        {comments.map(c => (
          <div key={c.id || c.created_at} className="comment">
            <div className="comment-header">
              <strong className="comment-author">{c.author_email}</strong>
              <em className="comment-date">{new Date(c.created_at).toLocaleString()}</em>
            </div>
            <p className="comment-body">{c.content}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="comments-section">
      <h4>Comments</h4>
      {renderContent()}
      <form className="comment-form" onSubmit={handlePost}>
        <textarea
          placeholder="Add a comment…"
          rows="3"
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!newText.trim()}>
          Post Comment
        </button>
      </form>
    </div>
  );
}