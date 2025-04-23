import { useState } from 'react'
import { useCookies } from 'react-cookie'

const Modal = ({ mode, setShowModal, getData, task }) => {
  const [cookies] = useCookies(null)
  const editMode = mode === 'edit'

  const [data, setData] = useState({
    user_email: editMode ? task.user_email : cookies.Email,
    title:      editMode ? task.title      : '',
    progress:   editMode ? task.progress   : 50,
    date:       editMode ? task.date       : new Date(),
    is_urgent:     editMode ? task.is_urgent     : false,
    is_important:  editMode ? task.is_important  : false,
    list_name:     editMode ? task.list_name     : 'General',
  })

  const postData = async e => {
    e.preventDefault()
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos`, {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(data)
      })
      if(res.ok){ setShowModal(false); getData() }
      else console.error('Failed to create', res.status)
    } catch(err){ console.error(err) }
  }

  const editData = async e => {
    e.preventDefault()
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/todos/${task.id}`, {
        method: 'PUT',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(data)
      })
      if(res.ok){ setShowModal(false); getData() }
      else console.error('Failed to update', res.status)
    } catch(err){ console.error(err) }
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setData(d => ({
      ...d,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="overlay">
      <div className="modal">
        <div className="form-title-container">
          <h3>Let's {mode} your task</h3>
          <button onClick={()=>setShowModal(false)}>X</button>
        </div>
        <form>
          <input
            required maxLength={30} placeholder="Your task"
            name="title" value={data.title} onChange={handleChange}
          /><br/>

          <label htmlFor="range">Progress</label>
          <input
            required type="range" id="range" min="0" max="100"
            name="progress" value={data.progress}
            onChange={handleChange}
          />

          <label>
            <input
              type="checkbox" name="is_urgent"
              checked={data.is_urgent} onChange={handleChange}
            /> Urgent
          </label>

          <label>
            <input
              type="checkbox" name="is_important"
              checked={data.is_important} onChange={handleChange}
            /> Important
          </label>

          <label>List</label>
          <select
            name="list_name"
            value={data.list_name}
            onChange={handleChange}
          >
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
            <option>Shopping</option>
          </select>

          <input
            className={mode} type="submit"
            onClick={editMode ? editData : postData}
          />
        </form>
      </div>
    </div>
  )
}

export default Modal
