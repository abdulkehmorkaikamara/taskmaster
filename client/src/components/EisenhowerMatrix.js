// src/components/EisenhowerMatrix.js

import React, { useState } from 'react';
import './EisenhowerMatrix.css';

/**
 * EisenhowerMatrix displays tasks in a 2x2 grid based on urgency & importance.
 * Users can drag tasks between quadrants to toggle their flags.
 */
export default function EisenhowerMatrix({ tasks, onUpdateTask, onBack }) {
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null);

  // Drag handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnter = (e, key) => {
    e.preventDefault();
    setDragOverQuadrant(key);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverQuadrant(null);
  };

  const handleDragOver = e => {
    e.preventDefault(); // Necessary to allow dropping
  };

  // On drop, update is_urgent/is_important
  const handleDrop = async (e, isUrgent, isImportant) => {
    e.preventDefault();
    setDragOverQuadrant(null); // Reset visual feedback
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id.toString() === id);
    if (!task) return;

    // Only update if values changed
    if (task.is_urgent !== isUrgent || task.is_important !== isImportant) {
      try {
        // Use the onUpdateTask function passed from App.js for consistency
        onUpdateTask(task.id, {
          is_urgent: isUrgent,
          is_important: isImportant
        });
      } catch (err) {
        console.error('Error updating task flags:', err);
      }
    }
  };

  // Quadrant definitions
  const quadrants = [
    { key: 'ui', title: 'Urgent & Important', filter: t => t.is_urgent && t.is_important, flags: { isUrgent: true, isImportant: true } },
    { key: 'nui', title: 'Important, Not Urgent', filter: t => !t.is_urgent && t.is_important, flags: { isUrgent: false, isImportant: true } },
    { key: 'uni', title: 'Urgent, Not Important', filter: t => t.is_urgent && !t.is_important, flags: { isUrgent: true, isImportant: false } },
    { key: 'nuni', title: 'Neither Urgent Nor Important', filter: t => !t.is_urgent && !t.is_important, flags: { isUrgent: false, isImportant: false } }
  ];

  return (
    <>
      <button className="btn btn-outline back-button" onClick={onBack}>&larr; Back to Tasks</button>
      <div className="eisenhower-matrix">
        {quadrants.map(q => (
          <div
            key={q.key}
            className={`quadrant ${dragOverQuadrant === q.key ? 'is-over' : ''}`}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, q.flags.isUrgent, q.flags.isImportant)}
            onDragEnter={e => handleDragEnter(e, q.key)}
            onDragLeave={handleDragLeave}
          >
            <h4>{q.title}</h4>
            <div className="quadrant-task-list">
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
    </>
  );
}