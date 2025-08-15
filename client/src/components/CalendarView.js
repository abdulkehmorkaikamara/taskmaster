// src/components/CalendarView.js
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarView.css';

export default function CalendarView({ tasks, onBack }) {
  const [viewDate, setViewDate] = useState(new Date());

  const prevMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // map tasks by yyyy-mm-dd to count
  const tasksByDate = useMemo(() => {
    return tasks.reduce((map, t) => {
      // FIX: Use 'start_at' which is the correct property from your tasks
      if (!t.start_at) return map;
      const day = new Date(t.start_at).toISOString().slice(0,10);
      map[day] = (map[day] || 0) + 1;
      return map;
    }, {});
  }, [tasks]);

  // build array of all cells to render
  const days = useMemo(() => {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays  = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // leading blanks
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    // actual days
    for (let date = 1; date <= numDays; date++) {
      cells.push(new Date(year, month, date));
    }
    return cells;
  }, [viewDate]);

  const todayKey = new Date().toISOString().slice(0,10);

  return (
    <div className="calendar-view-wrapper">
      <button className="btn btn-outline back-button" onClick={onBack}>
        &larr; Back to Tasks
      </button>
      <div className="calendar-header">
        <button className="btn calendar-nav" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="calendar-month">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="btn calendar-nav" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="calendar-grid">
        {weekdays.map(d => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
        {days.map((d, idx) => {
          if (!d) return <div key={idx} className="day empty" />;
          const key = d.toISOString().slice(0,10);
          const count = tasksByDate[key] || 0;
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`day${count ? ' has-tasks' : ''}${isToday ? ' today' : ''}`}
            >
              <span className="day-number">{d.getDate()}</span>
              {count > 0 && <div className="task-indicator"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}