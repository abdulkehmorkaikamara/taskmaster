// src/components/Modal.js
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import { v4 as uuidv4 } from "uuid";
import CreatableSelect from "react-select/creatable";
import { authenticatedFetch } from "../api";
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import "./Modal.css";

export default function Modal({ mode, setShowModal, getData, task, onTaskCreated }) {
  const [cookies] = useCookies(["Email"]);
  const editMode = mode === "edit";

  const [data, setData] = useState({
    user_email: editMode && task ? task.user_email : cookies.Email,
    title: editMode && task ? task.title : "",
    progress: editMode && task ? task.progress : 0,
    list_name: editMode && task ? task.list_name : "Backlog",
    tags: editMode && task?.tags ? task.tags.map((t) => ({ label: t, value: t })) : [],
    recurrence_rule: editMode && task ? task.recurrence_rule : 'none'
  });

  const [start_at, setStartAt] = useState(editMode && task ? task.start_at : null);
  const [subtasks, setSubtasks] = useState(
    editMode && task?.subtasks ? task.subtasks : [{ id: uuidv4(), title: "", completed: false }]
  );

  const toDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Adjust for timezone offset to display correctly in the input
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
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
      
      // Use the optimistic update for creating tasks
      if (!editMode && onTaskCreated) {
        const newTask = await res.json();
        onTaskCreated(newTask);
      } else {
        getData(); // Use the full refresh for editing
      }

      toast.success(`Task ${editMode ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error("Error saving task:", err);
      toast.error(`Failed to save task: ${err.message}`);
    }
  };

  return (
    <div className="overlay" onClick={() => setShowModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editMode ? "Edit Task" : "Create Task"}</h2>
          <button className="btn close-button" onClick={() => setShowModal(false)}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" required placeholder="Task title" value={data.title} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="start_at">Due Date & Time</label>
            <input id="start_at" name="start_at" type="datetime-local" value={toDateTimeLocal(start_at)} onChange={handleDateChange}/>
          </div>
          
          <div className="form-group">
            <label htmlFor="recurrence_rule">Repeats</label>
            <select id="recurrence_rule" name="recurrence_rule" value={data.recurrence_rule} onChange={handleChange}>
              <option value="none">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="progress">Progress: {data.progress}%</label>
            <input id="progress" name="progress" type="range" min="0" max="100" value={data.progress} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <CreatableSelect isMulti value={data.tags} onChange={handleTagsChange} placeholder="e.g. #work, #urgent…"/>
          </div>
          <div className="form-group">
            <label>Subtasks</label>
            <div className="subtasks-container">
              {subtasks.map((s) => (
                <div key={s.id} className="subtask-row">
                  <input type="text" placeholder="Subtask…" value={s.title} onChange={(e) => updateSubtask(s.id, { title: e.target.value })}/>
                  <button type="button" className="btn btn-danger" onClick={() => removeSubtask(s.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-outline add-subtask" onClick={addSubtask}>
              <Plus size={16} /> Add Subtask
            </button>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editMode ? "Save Changes" : "Create Task"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}