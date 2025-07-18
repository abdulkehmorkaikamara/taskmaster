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
  onUpdateTask
}) {
  const { t } = useTranslation();
  const [isCompleted, setIsCompleted] = useState(task.progress === 100);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsCompleted(task.progress === 100);
  }, [task.progress]);

  // Date / Time parsing & formatting
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

  const deleteItem = async () => {
    // A full implementation would require an onDeleteTask prop from App.js for optimistic updates
    // For now, we can just call the server and then reload.
    try {
        await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, { method: "DELETE" });
        window.location.reload();
    } catch (err) {
        alert("Failed to delete task.");
    }
  };

  const markAsCompleted = () => {
    if (isCompleted) return;
    onUpdateTask(task.id, { progress: 100, list_name: 'Done' });
    new Audio(doneSound).play().catch(() => {}); // Restored doneSound usage
  };

  const toggleSubtask = (sub) => {
    const updatedSubs = (task.subtasks || []).map(s =>
      s.id === sub.id ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask(task.id, { subtasks: updatedSubs });
  };

  return (
    <li className="list-item">
      <div className="info-container">
        <TickIcon />
        <p className="task-title">{task.title}</p>
        <p className="task-meta">
          {displayDate}
          {displayTime && `, ${displayTime}`}
        </p>
        <ProgressBar progress={task.progress} />
      </div>

      <div className="button-container">
        <input type="checkbox" className="task-checkbox" checked={isCompleted} onChange={markAsCompleted} aria-label={t('tasks.mark_complete')} />
        <button type="button" className="btn edit"  onClick={() => onEdit(task)}>{t('edit')}</button>
        <button type="button" className="btn start" onClick={() => onStart(task)}>{t('start')}</button>
        <button type="button" className="btn delete" onClick={deleteItem}>{t('delete')}</button>
      </div>

      {task.subtasks?.length > 0 && (
        <div className="subtasks-container">
          <button type="button" className="btn toggle-subtasks" onClick={() => setShowSubtasks(v => !v)}>
            {showSubtasks ? t('hide_checklist') : t('show_checklist')}
          </button>
          
          {/* Restored subtasks list which uses the toggleSubtask function */}
          {showSubtasks && (
            <div className="subtasks-list">
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
        </div>
      )}

      <button type="button" className="btn details-toggle" onClick={() => setShowDetails(v => !v)}>
        {showDetails ? t('hide_details') : t('show_details')}
      </button>
      {showDetails && (
        <div className="task-details">
          <ActivityLog taskId={task.id} />
          <CommentsSection taskId={task.id} userEmail={userEmail} />
        </div>
      )}
    </li>
  );
}
