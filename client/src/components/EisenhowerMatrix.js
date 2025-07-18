// src/components/EisenhowerMatrix.js

import React from 'react';
import './EisenhowerMatrix.css';


/**
 * EisenhowerMatrix displays tasks in a 2x2 grid based on urgency & importance.
 * Users can drag tasks between quadrants to toggle their flags.
 */
export default function EisenhowerMatrix({ tasks, getData }) {
  // Drag handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = e => {
    e.preventDefault();
  };

  // On drop, update is_urgent/is_important
  const handleDrop = async (e, isUrgent, isImportant) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id.toString() === id);
    if (!task) return;

    // Only update if values changed
    if (task.is_urgent !== isUrgent || task.is_important !== isImportant) {
      const updated = {
        user_email:   task.user_email,
        title:        task.title,
        progress:     task.progress,
        date:         task.date,
        time:         task.time,
        is_urgent:    isUrgent,
        is_important: isImportant,
        list_name:    task.list_name
      };

      try {
        const res = await fetch(
          `${process.env.REACT_APP_SERVERURL}/todos/${task.id}`,
          {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(updated)
          }
        );
        if (res.ok) getData();
      } catch (err) {
        console.error('Error updating task flags:', err);
      }
    }
  };

  // Quadrant definitions
  const quadrants = [
    {
      key: 'urgent-important',
      title: 'Urgent & Important',
      filter: t => t.is_urgent && t.is_important,
      flags: { isUrgent: true, isImportant: true }
    },
    {
      key: 'not-urgent-important',
      title: 'Important (Not Urgent)',
      filter: t => !t.is_urgent && t.is_important,
      flags: { isUrgent: false, isImportant: true }
    },
    {
      key: 'urgent-not-important',
      title: 'Urgent (Not Important)',
      filter: t => t.is_urgent && !t.is_important,
      flags: { isUrgent: true, isImportant: false }
    },
    {
      key: 'not-urgent-not-important',
      title: 'Neither',
      filter: t => !t.is_urgent && !t.is_important,
      flags: { isUrgent: false, isImportant: false }
    }
  ];

  return (
    <div className="eisenhower-matrix">
      {quadrants.map(q => (
        <div
          key={q.key}
          className="quadrant"
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, q.flags.isUrgent, q.flags.isImportant)}
        >
          <h4>{q.title}</h4>
          <div className="task-list">
            {tasks.filter(q.filter).map(task => (
              <div
                key={task.id}
                className="matrix-task"
                draggable
                onDragStart={e => handleDragStart(e, task.id)}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
