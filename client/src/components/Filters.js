// src/components/Filters.js

import React from 'react';
import Select from 'react-select';
import './Filters.css';

export default function Filters({ filters, setFilters, listOptions, tasks = [] }) {
  // Handler for the built-in form controls
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFilters(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Build tag options from all tasks (safe if tasks undefined)
  const allTags = Array.from(
    new Set(
      tasks.flatMap(t => t.tags || [])
    )
  ).map(tag => ({ label: tag, value: tag }));

  return (
    <div className="filters-container">
      
      <div className="filter-group">
        <label htmlFor="list-filter">List</label>
        <select
          id="list-filter"
          name="list_name"
          value={filters.list_name}
          onChange={handleChange}
        >
          {listOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status</label>
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
      </div>

      <div className="filter-group checkbox-container">
        <label>
          <input
            type="checkbox"
            name="is_urgent"
            checked={filters.is_urgent}
            onChange={handleChange}
          />
          Urgent
        </label>
        <label>
          <input
            type="checkbox"
            name="is_important"
            checked={filters.is_important}
            onChange={handleChange}
          />
          Important
        </label>
      </div>

      <div className="filter-group tag-filter">
        <label>Tags</label>
        <Select
          isMulti
          options={allTags}
          value={filters.tags || []}
          onChange={sel => setFilters(f => ({ ...f, tags: sel || [] }))}
          placeholder="Filter by tags…"
          className="tag-select-container"
          classNamePrefix="tag-select"
        />
      </div>

    </div>
  );
}
