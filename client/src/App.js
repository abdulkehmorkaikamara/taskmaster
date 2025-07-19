// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

// Component Imports
import Auth from "./components/Auth";
import TaskList from "./components/TaskList";
import KanbanBoard from "./components/KanbanBoard";
import ListHeader from "./components/ListHeader";
import Filters from "./components/Filters";
import Dashboard from "./components/Dashboard";
import Modal from "./components/Modal";
import ShareListModal from "./components/ShareListModal";
import Timer from "./components/Timer";
import CalendarView from "./components/CalendarView";
import EisenhowerMatrix from "./components/EisenhowerMatrix";
import SettingsPage from "./components/SettingsPage";
import ProfilePage from "./components/ProfilePage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ActivityLog from "./components/ActivityLog";
import CommentsSection from "./components/CommentsSection";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import MobileHeader from './components/MobileHeader';
import BottomNav from './components/BottomNav';
import { authenticatedFetch } from "./api";

// Page Imports
import GeneralSettings from "./pages/GeneralSettings";
import NotificationsSettings from "./pages/NotificationsSettings";
import DateTimeSettings from "./pages/DateTimeSettings";
import WidgetsSettings from "./pages/WidgetsSettings";
import IntegrationSettings from "./pages/IntegrationSettings";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import TabBarSettings from "./pages/TabBarSettings";

// CSS Imports
import "./index.css";
import "./Responsive.css";

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cookies, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const authToken = cookies.AuthToken;
  const userEmail = cookies.Email;
  
  const [tasks, setTasks] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  
  const [defaultPanel, setDefaultPanel] = useState(() => localStorage.getItem("defaultPanel") || "tasks");
  const [activePanel, setActivePanel] = useState(defaultPanel);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editTask, setEditTask] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  
  const [filters, setFilters] = useState({
    list_name: "All",
    status: "All",
    is_urgent: false,
    is_important: false,
    tags: []
  });

  const getData = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (err.message.indexOf('Session expired') === -1) console.error("Error fetching todos:", err);
      setTasks([]);
    }
  }, [userEmail]);

  useEffect(() => {
    if (authToken) getData();
  }, [authToken, getData]);

  useEffect(() => {
    if (!authToken) return;
    (async () => {
        try {
            const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/me`);
            if (res.ok) {
                const data = await res.json();
                setIsPremium(!!data.is_premium);
            }
        } catch (err) { /* handled by authenticatedFetch */ }
    })();
  }, [authToken]);
  
  useEffect(() => {
    localStorage.setItem("defaultPanel", defaultPanel);
  }, [defaultPanel]);

  async function updateTask(taskId, updates) {
    const originalTasks = [...tasks];
    const taskToUpdate = originalTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    const updatedTask = { ...taskToUpdate, ...updates };
    setTasks(currentTasks => currentTasks.map(t => (t.id === taskId ? updatedTask : t)));
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/todos/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(updatedTask),
      });
      if (!res.ok) setTasks(originalTasks);
    } catch (err) {
      setTasks(originalTasks);
    }
  }

  const handleMoveTask = (taskId, newList) => updateTask(taskId, { list_name: newList });
  const listOptions = useMemo(() => ["All", ...Array.from(new Set(tasks.map(t => t.list_name || "General"))).sort()], [tasks]);
  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (filters.list_name !== "All" && (t.list_name || "General") !== filters.list_name) return false;
    if (filters.status === "Completed" && t.progress < 100) return false;
    if (filters.status === "Pending" && t.progress === 100) return false;
    if (filters.is_urgent && !t.is_urgent) return false;
    if (filters.is_important && !t.is_important) return false;
    if (filters.tags.length > 0 && !filters.tags.map(x => x.value).every(tag => (t.tags || []).includes(tag))) return false;
    return true;
  }), [tasks, filters]);

  const handleSignOut = () => {
    removeCookie("Email", { path: "/" });
    removeCookie("AuthToken", { path: "/" });
    navigate("/login");
  };

  const handleSettingsClick = () => setActivePanel("settings");
  const openCreateModal = () => { setEditTask(null); setModalMode("create"); setShowModal(true); };
  const openEditModal = (task) => { setEditTask(task); setModalMode("edit"); setShowModal(true); };
  const handleShare = (listId) => { setActiveListId(listId); setModalMode("shareList"); setShowModal(true); };
  const startPomodoroFor = (task) => { setPomodoroTask(task); setActivePanel("timer"); };
  const handleReorder = (reordered) => setTasks(reordered);

  const MainApp = (
    <div className="app">
      <ListHeader onSignOut={handleSignOut} onSettingsClick={handleSettingsClick} listName={t('TaskMaster')} onShareClick={() => handleShare(filters.list_name)} />
      <MobileHeader onSignOut={handleSignOut} onSettingsClick={handleSettingsClick} listName={t('TaskMaster')} onShareClick={() => handleShare(filters.list_name)} />

      <div className="controls">
        <button className="btn create" onClick={openCreateModal}>{t('add_new')}</button>
        <button className="btn" onClick={() => setActivePanel('dashboard')}>{t('dashboard')}</button>
        <button className="btn" onClick={() => setActivePanel('boards')}>{t('boards')}</button>
        <button className="btn" onClick={() => setActivePanel('timer')}>{t('timer')}</button>
        <button className="btn" onClick={() => setActivePanel('analytics')}>{t('analytics')}</button>
      </div>

      <Filters filters={filters} setFilters={setFilters} listOptions={listOptions} tasks={tasks} />

      {activePanel === "tasks" && <TaskList tasks={filteredTasks} onUpdateTask={updateTask} onEdit={openEditModal} onStart={startPomodoroFor} onReorder={handleReorder} userEmail={userEmail} />}
      {activePanel === "boards" && <KanbanBoard tasks={filteredTasks} onMove={handleMoveTask} />}
      {activePanel === "dashboard" && <Dashboard tasks={filteredTasks} />}
      {activePanel === "timer" && <Timer pomodoroTask={pomodoroTask} />}
      {activePanel === "settings" && <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} filters={filters} setFilters={setFilters} listOptions={listOptions} />}
      {activePanel === "analytics" && <AnalyticsDashboard isPremium={isPremium} />}
      {activePanel === "calendar" && <CalendarView tasks={tasks} />}
      {activePanel === "priority" && <EisenhowerMatrix tasks={filteredTasks} onUpdateTask={updateTask} />}

      {showModal && modalMode === "shareList" && <ShareListModal listId={activeListId} onClose={() => setShowModal(false)} />}
      {showModal && modalMode !== "shareList" && <Modal mode={modalMode} task={editTask} setShowModal={setShowModal} getData={getData} />}
      
      <button className="floating-add-btn" onClick={openCreateModal}>
        <Plus size={28} />
      </button>

      <BottomNav activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
  
  if (!authToken) return <Auth />;

  return (
    <Routes>
      <Route path="/settings/general" element={<GeneralSettings />} />
      <Route path="/settings/notifications" element={<NotificationsSettings />} />
      <Route path="/settings/date-time" element={<DateTimeSettings />} />
      <Route path="/settings/widgets" element={<WidgetsSettings />} />
      <Route path="/settings/integration" element={<IntegrationSettings />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/tasks/:taskId/comments" element={<CommentsSection />} />
      <Route path="/tasks/:taskId/activity" element={<ActivityLog />} />
      <Route path="/settings/tab-bar" element={<TabBarSettings />} />
      <Route path="/*" element={MainApp} />
    </Routes>
  );
}

export default App;
