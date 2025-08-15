// src/components/TaskList.js
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ListItem from "./ListItem";

export default function TaskList({
  tasks,
  userEmail,
  onReorder,
  onEdit,
  onStart,
  onUpdateTask,
  onDeleteTask
}) {

  function handleDragEnd({ source, destination }) {
    if (!destination) return;
    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    onReorder(reordered);
    reordered.forEach((t, idx) =>
      fetch(`${process.env.REACT_APP_SERVERURL}/todos/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, position: idx })
      }).catch(console.error)
    );
  }

  return (
    <div className="task-list-container">
      <div className="filter-chips animated-fade-in">
        {tasks.length > 0 && (
          <>
            <span className="chip slide-in">List: {tasks[0].list_name}</span>
            <span className="chip slide-in delay">Total: {tasks.length}</span>
          </>
        )}
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="task-list">
          {(provided) => (
            <ul
              className="task-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {tasks
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={task.id}
                    index={index}
                  >
                    {(prov) => (
                      <li
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                      >
                        <ListItem
                          task={task}
                          userEmail={userEmail}
                          onEdit={() => onEdit(task)}
                          onStart={() => onStart(task)}
                          onUpdateTask={onUpdateTask}
                          onDelete={() => onDeleteTask(task.id)}
                        />
                      </li>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
