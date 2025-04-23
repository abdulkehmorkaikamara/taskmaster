import { useState } from "react";
import TickIcon from "./TickIcon";
import Modal from "./Modal";
import ProgressBar from "./ProgressBar";
import doneSound from "../assets/done.mp3";

const ListItem = ({ task, getData }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.progress === 100);

  const deleteItem = async (e) => {
    e.preventDefault();           // just in case
    console.log("⏳ Deleting task", task.id);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${task.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("❌ Delete failed:", err || res.statusText);
        alert("Failed to delete: " + (err?.error || res.statusText));
        return;
      }

      console.log("✅ Task deleted");
      getData();
    } catch (err) {
      console.error("❌ Error deleting task:", err);
      alert("Error deleting task: " + err.message);
    }
  };

  const markAsCompleted = async () => {
    if (isCompleted) return;
    const updated = {
      user_email:    task.user_email,
      title:         task.title,
      progress:      100,
      date:          task.date,
      is_urgent:     task.is_urgent,
      is_important:  task.is_important,
      list_name:     task.list_name,
    };

    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${task.id}`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(updated),
        }
      );

      if (!res.ok) {
        console.error("❌ Complete update failed");
        return;
      }

      setIsCompleted(true);
      new Audio(doneSound).play().catch(() => {});
      getData();
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  };

  return (
    <li className="list-item">
      <div className="info-container">
        <TickIcon />
        <p className="task-title">{task.title}</p>
        <ProgressBar progress={task.progress} />
      </div>

      <div className="button-container">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={markAsCompleted}
          aria-label="Mark task as completed"
        />

        <button
          type="button"
          className="edit"
          onClick={() => setShowModal(true)}
        >
          EDIT
        </button>

        <button
          type="button"
          className="delete"
          onClick={deleteItem}
        >
          DELETE
        </button>
      </div>

      {showModal && (
        <Modal
          mode="edit"
          setShowModal={setShowModal}
          getData={getData}
          task={task}
        />
      )}
    </li>
  );
};

export default ListItem;
