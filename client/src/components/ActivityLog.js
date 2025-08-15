// src/components/ActivityLog.js
import React, { useState, useEffect } from 'react';
import './ActivityLog.css'; // We'll create new styles for this

export default function ActivityLog({ taskId }) {
  const [log, setLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/activity`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Could not fetch activity log.');
        }
        const data = await res.json();
        setLog(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [taskId]);

  const renderContent = () => {
    if (isLoading) {
      return <p>Loading activity...</p>;
    }
    if (error) {
      return <p className="error-message">Error: {error}</p>;
    }
    if (log.length === 0) {
      return <p className="empty-state">No activity to show.</p>;
    }
    return (
      <ul className="log-list">
        {log.map((entry, index) => (
          <li key={index} className="log-entry">
            <span className="log-actor">{entry.actor_email}</span>
            <span className="log-action">{entry.action}</span>
            <span className="log-timestamp">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="activity-log">
      <h4>Activity</h4>
      {renderContent()}
    </div>
  );
}