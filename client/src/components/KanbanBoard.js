// src/components/KanbanBoard.js
import React, { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";
import "./KanbanBoard.css";

export default function KanbanBoard({ tasks, onMove }) {

  // =================================================================
  // DYNAMIC COLUMN LOGIC
  // =================================================================
  // Instead of hardcoding columns, we derive them from the tasks.
  // This makes the board automatically adapt to your data.
  const columns = useMemo(() => {
    // Get all unique list names from the tasks array
    const uniqueListNames = [...new Set(tasks.map(t => t.list_name || "Backlog"))];
    
    // Ensure a default set of columns exists even if there are no tasks
    const defaultCols = ["Backlog", "In Progress", "Done"];
    for (const col of defaultCols) {
        if (!uniqueListNames.includes(col)) {
            uniqueListNames.push(col);
        }
    }
    
    return uniqueListNames;
  }, [tasks]);

  // Group tasks by their list_name
  const tasksByColumn = useMemo(() => {
    const grouped = columns.reduce((acc, col) => {
      acc[col] = [];
      return acc;
    }, {});

    tasks.forEach(task => {
      const colName = task.list_name || "Backlog"; // Default to Backlog if no list_name
      if (grouped[colName]) {
        grouped[colName].push(task);
      }
    });

    return grouped;
  }, [tasks, columns]);


  function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    
    // Do nothing if dropped outside a valid column
    if (!destination) return;
    
    // Do nothing if dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Call the onMove function passed in props to update the task's list_name
    onMove(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map(columnName => (
          <Droppable key={columnName} droppableId={columnName}>
            {(provided, snapshot) => (
              <div
                className={`kanban-column ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h3>{columnName}</h3>
                <div className="kanban-column-content">
                  {tasksByColumn[columnName].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(prov, snap2) => (
                        <div
                          className={`kanban-card ${snap2.isDragging ? "dragging" : ""}`}
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          {task.title}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
