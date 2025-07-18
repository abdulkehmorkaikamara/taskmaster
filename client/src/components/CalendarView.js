import React, { useState, useMemo } from 'react';
import './CalendarView.css';

export default function CalendarView({ tasks }) {
  // state for current viewed month/year
  const [viewDate, setViewDate] = useState(new Date());

  // helpers to jump month
  const prevMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // weekday labels
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // map tasks by yyyy-mm-dd to count
  const tasksByDate = useMemo(() => {
    return tasks.reduce((map, t) => {
      if (!t.date) return map;
      const day = new Date(t.date).toISOString().slice(0,10);
      map[day] = (map[day] || 0) + 1;
      return map;
    }, {});
  }, [tasks]);

  // build array of all cells to render
  const days = useMemo(() => {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // first of month weekday
    const firstDay = new Date(year, month, 1).getDay();
    // number of days
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
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}>{'<'}</button>
        <div className="calendar-month">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button className="calendar-nav" onClick={nextMonth}>{'>'}</button>
      </div>
      <div className="calendar-day-names">
        {weekdays.map(d => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((d, idx) => {
          if (!d) return <div key={idx} className="day empty" />;
          const key = d.toISOString().slice(0,10);
          const count = tasksByDate[key] || 0;
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`day${count ? ' has-task' : ''}${isToday ? ' today' : ''}`}
            >
              <span className="day-number">{d.getDate()}</span>
              {count > 0 && <span className="task-count">{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
