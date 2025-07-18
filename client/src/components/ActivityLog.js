// src/components/ActivityLog.js
import React, { useState, useEffect } from 'react';

export default function ActivityLog({ taskId }) {
  const [log, setLog] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVERURL}/tasks/${taskId}/activity`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(setLog);
  }, [taskId]);

  return (
    <div className="activity-log">
      <h4>Activity</h4>
      {log.map((e, i) => (
        <div key={i}>
          <strong>{e.actor_email}</strong> {e.action}{' '}
          <small>{new Date(e.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
