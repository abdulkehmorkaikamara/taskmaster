// src/components/KanbanBoard.js
import React, { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";
import "./KanbanBoard.css";

export default function KanbanBoard({ tasks, onMove, onBack }) { // <-- Added onBack prop

  const columns = useMemo(() => {
    const uniqueListNames = [...new Set(tasks.map(t => t.list_name || "Backlog"))];
    const defaultCols = ["Backlog", "In Progress", "Done"];
    for (const col of defaultCols) {
        if (!uniqueListNames.includes(col)) {
            uniqueListNames.push(col);
        }
    }
    return uniqueListNames;
  }, [tasks]);

  const tasksByColumn = useMemo(() => {
    const grouped = columns.reduce((acc, col) => {
      acc[col] = [];
      return acc;
    }, {});

    tasks.forEach(task => {
      const colName = task.list_name || "Backlog";
      if (grouped[colName]) {
        grouped[colName].push(task);
      }
    });

    return grouped;
  }, [tasks, columns]);

  function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
        return;
    }
    onMove(draggableId, destination.droppableId);
  }

  return (
    <>
      {/* Added a consistent Back button */}
      <button className="btn btn-outline back-button" onClick={onBack}>&larr; Back to Tasks</button>

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
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </>
  );
}