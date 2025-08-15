// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import LandingPage from "./pages/LandingPage";

// CSS Imports
import "./index.css";
import "./Responsive.css";

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cookies, setCookie, removeCookie] = useCookies(["Email", "AuthToken", "UserName", "UserAvatar"]);
  
  const authToken = cookies.AuthToken;
  const userEmail = cookies.Email;
  const [isLoading, setIsLoading] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
 const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const defaultPanel = localStorage.getItem("defaultPanel") || "tasks";
  const [activePanel, setActivePanel] = useState(defaultPanel);

  const [userName, setUserName] = useState(cookies.UserName || "");
  const [userAvatar, setUserAvatar] = useState(cookies.UserAvatar || "/default-avatar.png");

  // --- NEW: State for Voice Settings ---
  const [voiceSettings, setVoiceSettings] = useState({
    remindersEnabled: true,
    language: 'en-US',
    gender: 'Female'
  });
  const [availableVoices, setAvailableVoices] = useState([]);

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
        setTasks(Array.isArray(data) ? data.map(t => ({ ...t, notified: false })) : []);
      }
    } catch (err) {
      if (!err.message.includes('Session expired')) console.error("Error fetching todos:", err);
      setTasks([]);
    }
  }, [userEmail]);

  useEffect(() => {
    const checkAuth = async () => {
      if (authToken) {
        await getData();
        try {
          const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/me`);
          if (res.ok) {
            const data = await res.json();
            setIsPremium(!!data.is_premium);
            if (data.name) {
              setUserName(data.name);
              setCookie("UserName", data.name, { path: "/" });
            }
            if (data.avatar) {
              setUserAvatar(data.avatar);
              setCookie("UserAvatar", data.avatar, { path: "/" });
            }
          }
        } catch (err) {
          console.error("❌ Failed to fetch user profile:", err);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [authToken, getData, setCookie]);

  useEffect(() => {
    localStorage.setItem("defaultPanel", activePanel);
  }, [activePanel]);

  useEffect(() => {
  document.body.classList.toggle("dark", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
}, [isDarkMode]);


  // --- UPDATED: Voice Reminder Logic ---

  // HOOK 1: Get the list of available voices. Runs only once.
  useEffect(() => {
    const populateVoiceList = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    // Voices may load asynchronously. This ensures the list is populated.
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, []); 

  // HOOK 2: Set up the reminder interval.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (!voiceSettings.remindersEnabled || !task.start_at || task.progress === 100 || task.notified) return task;
          
          const taskTime = new Date(task.start_at);
          const diff = taskTime - now;
          const minutes = Math.floor(diff / (1000 * 60));

          if (minutes === 5 || minutes === 1) {
            const name = cookies.Email?.split('@')[0] || 'user';
            const timePhrase = minutes === 5 ? "five" : "one";
            const message = `Hey ${name}, your ${task.title} task is about to start in ${timePhrase} minutes.`;
            const utterance = new SpeechSynthesisUtterance(message);
            
            const selectedVoice = availableVoices.find(v => 
              v.lang === voiceSettings.language && v.name.toLowerCase().includes(voiceSettings.gender.toLowerCase())
            ) || availableVoices.find(v => v.lang === voiceSettings.language);

            utterance.voice = selectedVoice || null;
            speechSynthesis.speak(utterance);
            return { ...task, notified: true };
          }
          return task;
        });
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [cookies.Email, voiceSettings, availableVoices]); 

  const updateTask = async (taskId, updates) => {
    const originalTasks = [...tasks];
    const updatedTask = { ...originalTasks.find(t => t.id === taskId), ...updates };
    setTasks(tasks.map(t => (t.id === taskId ? updatedTask : t)));
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/todos/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) setTasks(originalTasks);
    } catch {
      setTasks(originalTasks);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/todos/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete task");
    }
  };

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
    ["Email", "AuthToken", "UserName", "UserAvatar"].forEach((c) => removeCookie(c, { path: "/" }));
    toast.success("You have been signed out.");
    navigate("/");
  };

  const handleSettingsClick = () => setActivePanel("settings");
  const openCreateModal = () => { setEditTask(null); setModalMode("create"); setShowModal(true); };
  const openEditModal = (task) => { setEditTask(task); setModalMode("edit"); setShowModal(true); };
  const handleShare = (listId) => { setActiveListId(listId); setModalMode("shareList"); setShowModal(true); };
  const startPomodoroFor = (task) => { setPomodoroTask(task); setActivePanel("timer"); };
  const handleReorder = (reordered) => setTasks(reordered);
  const handleBackToTasks = () => setActivePanel("tasks");

  const MainApp = (
    <div className="app">
      <ListHeader onSignOut={handleSignOut} onSettingsClick={handleSettingsClick} listName={t('TaskMaster')} onShareClick={() => handleShare(filters.list_name)} />
      <MobileHeader onSignOut={handleSignOut} onSettingsClick={handleSettingsClick} listName={t('TaskMaster')} onShareClick={() => handleShare(filters.list_name)} />
      <div className="main-controls-container">
        <Filters filters={filters} setFilters={setFilters} listOptions={listOptions} tasks={tasks} />
        <div className="filter-bar">
          <button className="btn btn-primary" onClick={openCreateModal}>{t('add_new')}</button>
          <button className="btn btn-outline" onClick={() => setActivePanel('dashboard')}>{t('dashboard')}</button>
          <button className="btn btn-outline" onClick={() => setActivePanel('boards')}>{t('boards')}</button>
          <button className="btn btn-outline" onClick={() => setActivePanel('timer')}>{t('timer')}</button>
          <button className="btn btn-outline" onClick={() => setActivePanel('analytics')}>{t('analytics')}</button>
        </div>
      </div>
      {activePanel === "tasks" && <TaskList tasks={filteredTasks} onUpdateTask={updateTask} onEdit={openEditModal} onStart={startPomodoroFor} onReorder={handleReorder} userEmail={userEmail} onDeleteTask={handleDeleteTask} />}
      {activePanel === "boards" && <KanbanBoard tasks={filteredTasks} onMove={handleMoveTask} onBack={handleBackToTasks} />}
      {activePanel === "dashboard" && <Dashboard tasks={filteredTasks} onBack={handleBackToTasks} />}
      {activePanel === "timer" && <Timer pomodoroTask={pomodoroTask} onBack={handleBackToTasks} />}
     

      {activePanel === "settings" && <SettingsPage 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          onBack={handleBackToTasks}
          userName={userName}
          setUserName={setUserName}
          userAvatar={userAvatar}
          setUserAvatar={setUserAvatar}
          voiceSettings={voiceSettings}
          setVoiceSettings={setVoiceSettings}
          availableVoices={availableVoices}
      />}
      {activePanel === "analytics" && <AnalyticsDashboard isPremium={isPremium} onBack={handleBackToTasks} />}
      {activePanel === "calendar" && <CalendarView tasks={tasks} onBack={handleBackToTasks} />}
      {activePanel === "priority" && <EisenhowerMatrix tasks={filteredTasks} onUpdateTask={updateTask} onBack={handleBackToTasks} />}
      {showModal && modalMode === "shareList" && <ShareListModal listId={activeListId} onClose={() => setShowModal(false)} />}
      {showModal && modalMode !== "shareList" && <Modal mode={modalMode} task={editTask} setShowModal={setShowModal} getData={getData} />}
      <button className="floating-action-button" onClick={openCreateModal}><Plus size={28} /></button>
      <BottomNav activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Loading TaskMaster...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        <Route path="/" element={authToken ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route path="/login" element={authToken ? <Navigate to="/app" replace /> : <Auth />} />
        <Route path="/signup" element={authToken ? <Navigate to="/app" replace /> : <Auth />} />
        <Route path="/app" element={authToken ? MainApp : <Navigate to="/login" replace />} />

        <Route 
          path="/settings/general" 
          element={
            <GeneralSettings 
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              voiceSettings={voiceSettings}
              setVoiceSettings={setVoiceSettings}
              availableVoices={availableVoices}
              isPremium={isPremium}
            />
          } 
        />
        <Route path="/settings/notifications" element={<NotificationsSettings />} />
        <Route path="/settings/date-time" element={<DateTimeSettings />} />
        <Route path="/settings/widgets" element={<WidgetsSettings />} />
        <Route path="/settings/integration" element={<IntegrationSettings />} />
        <Route path="/settings/tab-bar" element={<TabBarSettings />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/tasks/:taskId/comments" element={<CommentsSection />} />
        <Route path="/tasks/:taskId/activity" element={<ActivityLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;