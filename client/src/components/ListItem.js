// src/components/ListItem.js

import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import TickIcon         from "./TickIcon";
import ProgressBar      from "./ProgressBar";
import doneSound        from "../assets/done.mp3";
import CommentsSection  from "./CommentsSection";
import ActivityLog      from "./ActivityLog";
import "./ListItem.css";

export default function ListItem({
  task,
  userEmail,
  onEdit,
  onStart,
  onUpdateTask,
  onDelete
}) {
  const { t } = useTranslation();
  const [isCompleted, setIsCompleted] = useState(task.progress === 100);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsCompleted(task.progress === 100);
  }, [task.progress]);

  let displayDate = t('tasks.no_due_date');
  let displayTime = "";
  if (task.start_at) {
    const startDate = new Date(task.start_at);
    if (!isNaN(startDate.getTime())) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow); dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

      if (startDate >= today && startDate < tomorrow) {
        displayDate = "Today";
      } else if (startDate >= tomorrow && startDate < dayAfterTomorrow) {
        displayDate = "Tomorrow";
      } else {
        displayDate = startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }
      displayTime = startDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } else {
      displayDate = "Invalid date";
    }
  }

  const markAsCompleted = () => {
    if (isCompleted) return;
    onUpdateTask(task.id, { progress: 100, list_name: 'Done' });
    new Audio(doneSound).play().catch(() => {});
  };

  const toggleSubtask = (sub) => {
    const updatedSubs = (task.subtasks || []).map(s =>
      s.id === sub.id ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask(task.id, { subtasks: updatedSubs });
  };

  return (
    // This is the main card container for a single task
    <div className="list-item">
      {/* This new wrapper holds the always-visible, horizontal content */}
      <div className="list-item-row">
        
        {/* Group 1: The main task info, which will grow to fill space */}
        <div className="task-info">
          <TickIcon onClick={markAsCompleted} isCompleted={isCompleted} />
          <div>
            <p className="task-title">{task.title}</p>
            <p className="task-meta">
              {displayDate}
              {displayTime && `, ${displayTime}`}
            </p>
          </div>
        </div>

        {/* Group 2: The progress bar */}
        <div className="progress-container">
          <ProgressBar progress={task.progress} />
        </div>

        {/* Group 3: All action buttons with updated, consistent classes */}
        <div className="button-container">
          <button type="button" className="btn btn-secondary"  onClick={() => onEdit(task)}>{t('edit')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => onStart(task)}>{t('start')}</button>
          <button type="button" className="btn btn-danger" onClick={onDelete}>{t('delete')}</button>
          
          {task.subtasks?.length > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setShowSubtasks(v => !v)}>
              {showSubtasks ? t('hide_checklist') : t('show_checklist')}
            </button>
          )}

          <button type="button" className="btn btn-outline" onClick={() => setShowDetails(v => !v)}>
            {showDetails ? t('hide_details') : t('show_details')}
          </button>
        </div>
      </div>

      {/* Conditionally rendered content now appears cleanly below the main row */}
      {showSubtasks && (
        <div className="subtasks-list expanded-section">
          {task.subtasks.map(sub => (
            <label key={sub.id} className="subtask-item">
              <input
                type="checkbox"
                checked={sub.completed}
                onChange={() => toggleSubtask(sub)}
              />
              <span className={sub.completed ? "completed" : ""}>
                {sub.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {showDetails && (
        <div className="task-details expanded-section">
          <ActivityLog taskId={task.id} />
          <CommentsSection taskId={task.id} userEmail={userEmail} />
        </div>
      )}
    </div>
  );
}