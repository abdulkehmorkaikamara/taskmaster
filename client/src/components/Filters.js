import React from 'react'

const Filters = ({ filters, setFilters, listOptions }) => {
  const handle = e => {
    const { name, value, type, checked } = e.target
    setFilters(f => ({
      ...f,
      [name]: type==='checkbox' ? checked : value
    }))
  }

  return (
    <div className="filters">
      <label>
        List:
        <select name="list_name" value={filters.list_name} onChange={handle}>
          <option value="All">All</option>
          {listOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label>
        Status:
        <select name="status" value={filters.status} onChange={handle}>
          <option>All</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          name="is_urgent"
          checked={filters.is_urgent}
          onChange={handle}
        /> Urgent
      </label>

      <label>
        <input
          type="checkbox"
          name="is_important"
          checked={filters.is_important}
          onChange={handle}
        /> Important
      </label>
    </div>
  )
}

export default Filters
