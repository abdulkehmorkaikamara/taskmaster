// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";
import { Routes, Route } from "react-router-dom";

import Auth           from "./components/Auth";
import ListHeader     from "./components/ListHeader";
import Filters        from "./components/Filters";
import Dashboard      from "./components/Dashboard";
import ListItem       from "./components/ListItem";
import Modal          from "./components/Modal";
import Timer          from "./components/Timer";
import CalendarView   from "./components/CalendarView";
import SettingsPage   from "./components/SettingsPage";
import TabBarSettings from "./pages/TabBarSettings";

import "./index.css";

const App = () => {
  const [cookies, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const authToken  = cookies.AuthToken;
  const userEmail  = cookies.Email;

  // Persisted settings
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [defaultPanel, setDefaultPanel] = useState(
    () => localStorage.getItem("defaultPanel") || "tasks"
  );
  const [activePanel, setActivePanel] = useState(defaultPanel);

  // Tasks + modal
  const [tasks, setTasks]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editTask, setEditTask]   = useState(null);
  const [filters, setFilters]     = useState({
    list_name:    "All",
    status:       "All",
    is_urgent:    false,
    is_important: false,
  });

  // Fetch todos
  const getData = useCallback(async () => {
    try {
      const res  = await fetch(
        `${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`
      );
      const json = await res.json();
      setTasks(json);
    } catch (err) {
      console.error("Error fetching todos:", err);
    }
  }, [userEmail]);

  useEffect(() => {
    if (authToken) getData();
  }, [authToken, getData]);

  // Dark‑mode side‑effect
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  // Persist default panel
  useEffect(() => {
    localStorage.setItem("defaultPanel", defaultPanel);
  }, [defaultPanel]);

  // Build listOptions for Filters
  const listOptions = useMemo(() => {
    const names = tasks.map((t) => t.list_name ?? "Default");
    return ["All", ...Array.from(new Set(names)).sort()];
  }, [tasks]);

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filters.list_name !== "All" && t.list_name !== filters.list_name)
      return false;
    if (filters.status === "Completed" && t.progress < 100)   return false;
    if (filters.status === "Pending"   && t.progress === 100) return false;
    if (filters.is_urgent    && !t.is_urgent)                 return false;
    if (filters.is_important && !t.is_important)              return false;
    return true;
  });

  // Sign‑out
  const handleSignOut = () => {
    removeCookie("Email",     { path: "/" });
    removeCookie("AuthToken", { path: "/" });
    window.location.reload();
  };

  // If not authenticated
  if (!authToken) return <Auth />;
  <Routes>
  {/* …other routes… */}
  <Route path="/settings/tab-bar" element={<TabBarSettings />} />
</Routes>

  // The main app UI
  const MainApp = (
    <div className="app">
      <ListHeader
        listName={
          filters.list_name === "All" ? "✧˚ TaskMaster ˚✧" : filters.list_name
        }
        getData={getData}
        toggleDashboard={() => {
          setActivePanel((p) => (p === "dashboard" ? "tasks" : "dashboard"));
          setDefaultPanel("dashboard");
        }}
        onSettingsClick={() => {
          setActivePanel("settings");
          setDefaultPanel("settings");
        }}
        onSignOut={handleSignOut}
      />

      <div className="controls">
        <button
          className="btn create"
          onClick={() => {
            setModalMode("create");
            setEditTask(null);
            setShowModal(true);
          }}
        >
          ADD NEW
        </button>
        <button
          className="btn dashboard-toggle"
          onClick={() => {
            setActivePanel((p) => (p === "dashboard" ? "tasks" : "dashboard"));
            setDefaultPanel("dashboard");
          }}
        >
          {activePanel === "dashboard" ? "Hide Dashboard" : "Dashboard"}
        </button>
        <button
          className="btn timer-toggle"
          onClick={() => {
            setActivePanel("timer");
            setDefaultPanel("timer");
          }}
        >
          Timer
        </button>
      </div>

      <Filters
        filters={filters}
        setFilters={setFilters}
        listOptions={listOptions}
      />

      {activePanel === "dashboard" && <Dashboard tasks={filteredTasks} />}

      {activePanel === "timer" && (
        <Timer
          onTasksClick={()     => { setActivePanel("tasks");    setDefaultPanel("tasks"); }}
          onCalendarClick={()  => { setActivePanel("calendar"); setDefaultPanel("calendar"); }}
          onPriorityClick={()  => { setActivePanel("priority"); setDefaultPanel("priority"); }}
          onTimerClick={()     => { setActivePanel("timer");    setDefaultPanel("timer"); }}
          onSettingsClick={()  => { setActivePanel("settings"); setDefaultPanel("settings"); }}
        />
      )}

      {activePanel === "calendar" && <CalendarView tasks={tasks} />}

      {activePanel === "priority" && (
        <div className="priority-panel">
          <h2>⋯ Urgent & Important</h2>
          <ul className="task-list">
            {tasks
              .filter((t) => t.is_urgent || t.is_important)
              .map((t) => (
                <ListItem key={t.id} task={t} getData={getData} />
              ))}
          </ul>
        </div>
      )}

      {activePanel === "settings" && (
        <SettingsPage
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          defaultPanel={defaultPanel}
          setDefaultPanel={setDefaultPanel}
          filters={filters}
          setFilters={setFilters}
          listOptions={listOptions}
        />
      )}

      {activePanel === "tasks" && (
        <>
          <p className="welcome">Welcome back, {userEmail}</p>
          <ul className="task-list">
            {filteredTasks.map((task) => (
              <ListItem
                key={task.id}
                task={task}
                getData={getData}
                onEdit={() => {
                  setEditTask(task);
                  setModalMode("edit");
                  setShowModal(true);
                }}
              />
            ))}
          </ul>
        </>
      )}

      {showModal && (
        <Modal
          mode={modalMode}
          task={editTask}
          setShowModal={setShowModal}
          getData={getData}
        />
      )}
    </div>
  );

  return (
    <Routes>
  
      {/* settings pages */}
      <Route
        path="/settings/tab-bar"
        element={<TabBarSettings />}
      />
  
      <Route
        path="/settings"
        element={
          <SettingsPage
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            defaultPanel={defaultPanel}
            setDefaultPanel={setDefaultPanel}
            filters={filters}
            setFilters={setFilters}
            listOptions={listOptions}
          />
        }
      />
  
      {/* everything else */}
      <Route path="/*" element={MainApp} />
  
    </Routes>
  );
}  

export default App;
