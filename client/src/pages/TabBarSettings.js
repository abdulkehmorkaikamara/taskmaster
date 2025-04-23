import React, { useState } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";

/*
 * TabBarSettings – lets the user:
 *   • Re‑order primary tabs (drag & drop)
 *   • Toggle visibility of rarely‑used tabs
 *
 * Persisting the settings:
 *   – Replace the localStorage logic with API calls once an endpoint is ready.
 */
const DEFAULT_TABS = [
  { id: "inbox", label: "Inbox", builtIn: true },
  { id: "calendar", label: "Calendar", builtIn: true },
  { id: "notes", label: "Notes", builtIn: true },
  { id: "habit", label: "Habit", builtIn: false },
  { id: "focus", label: "Focus", builtIn: false }
];

const readTabs = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("tab‑bar"));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (_) {}
  return DEFAULT_TABS;
};

const writeTabs = (tabs) => localStorage.setItem("tab‑bar", JSON.stringify(tabs));

const TabBarSettings = () => {
  const [tabs, setTabs] = useState(readTabs);
  const [dragIndex, setDragIndex] = useState(null);

  /* -------------------------------------------------------------------- */
  /* drag & drop helpers                                                  */
  /* -------------------------------------------------------------------- */
  const onDragStart = (idx) => () => setDragIndex(idx);
  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    if (dragIndex === idx) return;
    const newTabs = [...tabs];
    const [moved] = newTabs.splice(dragIndex, 1);
    newTabs.splice(idx, 0, moved);
    setDragIndex(idx);
    setTabs(newTabs);
  };
  const onDragEnd = () => {
    writeTabs(tabs);
    setDragIndex(null);
  };

  /* -------------------------------------------------------------------- */
  /* visibility toggle                                                    */
  /* -------------------------------------------------------------------- */
  const toggle = (id) => {
    const next = tabs.map((t) => (t.id === id ? { ...t, hidden: !t.hidden } : t));
    setTabs(next);
    writeTabs(next);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Tab Bar</h1>
      <p className="text-sm text-muted-foreground">
        Drag to reorder your tabs. Disable a tab to hide it from the bar (you can always re‑enable it here).
      </p>

      <ul className="bg-muted rounded-2xl divide-y">
        {tabs.map((tab, idx) => (
          <li
            key={tab.id}
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={onDragOver(idx)}
            onDragEnd={onDragEnd}
            className="flex items-center gap-3 px-4 py-3 cursor-grab select-none hover:bg-muted/75"
          >
            <GripVertical className="shrink-0" />
            <span className="flex-1 capitalize">{tab.label}</span>
            <button onClick={() => toggle(tab.id)} className="shrink-0">
              {tab.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabBarSettings;
