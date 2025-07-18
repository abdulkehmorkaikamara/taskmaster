// src/components/Filters.js

import React from 'react';
import Select from 'react-select';
import './Filters.css';

export default function Filters({ filters, setFilters, listOptions, tasks }) {
  // Handler for the built-in form controls
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFilters(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Build tag options from all tasks
  const allTags = Array.from(
    new Set(tasks.flatMap(t => t.tags || []))
  ).map(tag => ({ label: tag, value: tag }));

  return (
    <div className="filters">
      {/* List selector */}
      <label htmlFor="list-filter">
        List:
        <select
          id="list-filter"
          name="list_name"
          value={filters.list_name}
          onChange={handleChange}
        >
          <option value="All">All</option>
          {listOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      {/* Status selector */}
      <label htmlFor="status-filter">
        Status:
        <select
          id="status-filter"
          name="status"
          value={filters.status}
          onChange={handleChange}
        >
          <option value="All">All</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </label>

      {/* Urgent / Important checkboxes */}
      <label>
        <input
          type="checkbox"
          name="is_urgent"
          checked={filters.is_urgent}
          onChange={handleChange}
        />{' '}
        Urgent
      </label>
      <label>
        <input
          type="checkbox"
          name="is_important"
          checked={filters.is_important}
          onChange={handleChange}
        />{' '}
        Important
      </label>

      {/* Tag-cloud multi-select */}
      <div className="tag-filter-wrapper">
        <Select
          isMulti
          options={allTags}
          value={filters.tags || []}
          onChange={sel => setFilters(f => ({ ...f, tags: sel || [] }))}
          placeholder="Filter by tags…"
          className="tag-filter"
        />
      </div>
    </div>
  );
}
