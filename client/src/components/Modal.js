// src/components/Modal.js
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import { v4 as uuidv4 } from "uuid";
import CreatableSelect from "react-select/creatable";
import { authenticatedFetch } from "../api";
import "./Modal.css";

export default function Modal({ mode, setShowModal, getData, task }) {
  const [cookies] = useCookies(["Email"]);
  const editMode = mode === "edit";

  const [data, setData] = useState({
    user_email: editMode && task ? task.user_email : cookies.Email,
    title: editMode && task ? task.title : "",
    progress: editMode && task ? task.progress : 0, // Default progress to 0 for new tasks
    // ===================================================================
    // THE FIX: Add a default list_name for new tasks.
    // ===================================================================
    list_name: editMode && task ? task.list_name : "Backlog",
    recurrence: editMode && task ? task.recurrence : "none",
    reminder_offset: editMode && task ? task.reminder_offset : 0,
    tags:
      editMode && task?.tags
        ? task.tags.map((t) => ({ label: t, value: t }))
        : [],
  });
  
  const [start_at, setStartAt] = useState(editMode && task ? task.start_at : null);
  const [subtasks, setSubtasks] = useState(
    editMode && task?.subtasks
      ? task.subtasks
      : [{ id: uuidv4(), title: "", completed: false }],
  );

  const toDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      setStartAt(new Date(e.target.value).toISOString());
    } else {
      setStartAt(null);
    }
  };

  const handleTagsChange = (selected) => {
    setData((d) => ({ ...d, tags: selected || [] }));
  };

  const updateSubtask = (id, changes) =>
    setSubtasks((st) => st.map((s) => (s.id === id ? { ...s, ...changes } : s)));

  const addSubtask = () =>
    setSubtasks((st) => [...st, { id: uuidv4(), title: "", completed: false }]);

  const removeSubtask = (id) =>
    setSubtasks((st) => st.filter((s) => s.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...data,
      start_at,
      subtasks,
      tags: data.tags.map((t) => t.value),
    };

    const url = `${process.env.REACT_APP_SERVERURL}/todos${editMode && task ? `/${task.id}` : ""}`;
    const method = editMode ? "PUT" : "POST";

    try {
      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to save task");
      }
      
      setShowModal(false);
      getData();
    } catch (err) {
      console.error("Error saving task:", err);
      alert("Failed to save task: " + err.message);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <button type="button" className="close-btn" onClick={() => setShowModal(false)}>×</button>
        <h2>{editMode ? "Edit Task" : "Create Task"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" required placeholder="Task title" value={data.title} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="start_at">Due Date & Time</label>
            <input id="start_at" name="start_at" type="datetime-local" value={toDateTimeLocal(start_at)} onChange={handleDateChange}/>
          </div>
          <div className="progress-group">
            <label htmlFor="progress">Progress: {data.progress}%</label>
            <input id="progress" name="progress" type="range" min="0" max="100" value={data.progress} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <CreatableSelect isMulti value={data.tags} onChange={handleTagsChange} placeholder="e.g. #work, #urgent…"/>
          </div>
          <div className="form-group subtasks-group">
            <label>Subtasks</label>
            {subtasks.map((s) => (
              <div key={s.id} className="subtask-row">
                <input type="text" placeholder="Subtask…" value={s.title} onChange={(e) => updateSubtask(s.id, { title: e.target.value })}/>
                <button type="button" onClick={() => removeSubtask(s.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn add-subtask" onClick={addSubtask}>+ Add Subtask</button>
          </div>
          <div className="button-group">
            <button type="button" className="btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn save">{editMode ? "Save" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
