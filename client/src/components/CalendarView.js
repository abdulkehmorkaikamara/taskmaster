import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./CalendarView.css"; // optional, for your own styling

const CalendarView = ({ tasks = [] }) => {
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const dateKey = new Date(task.date).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const dates = Object.keys(tasksByDate).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return (
    <div className="calendar-view">
      <h2>📅 Calendar</h2>
      {dates.length === 0 ? (
        <p>No tasks scheduled.</p>
      ) : (
        dates.map(date => (
          <div key={date} className="calendar-day">
            <h3>{date}</h3>
            <ul>
              {tasksByDate[date].map(t => (
                <li key={t.id}>
                  <strong>{t.title}</strong> — {t.progress}% complete
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

CalendarView.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      progress: PropTypes.number.isRequired,
    })
  ),
};

export default CalendarView;
