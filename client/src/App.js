// src/App.js
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { useCookies } from "react-cookie";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// All your component imports
import Auth                from "./components/Auth";
import TaskList            from "./components/TaskList";
import KanbanBoard         from "./components/KanbanBoard";
import ListHeader          from "./components/ListHeader";
import Filters             from "./components/Filters";
import Dashboard           from "./components/Dashboard";
import Modal               from "./components/Modal";
import ShareListModal      from "./components/ShareListModal";
import Timer               from "./components/Timer";
import CalendarView        from "./components/CalendarView";
import EisenhowerMatrix    from "./components/EisenhowerMatrix";
import SettingsPage        from "./components/SettingsPage";
import ProfilePage         from "./components/ProfilePage";
import ForgotPassword      from "./components/ForgotPassword";
import ResetPassword       from "./components/ResetPassword";
import ActivityLog         from "./components/ActivityLog";
import CommentsSection     from "./components/CommentsSection";
import AnalyticsDashboard  from "./components/AnalyticsDashboard";
import { authenticatedFetch } from "./api";
import BottomNav from './components/BottomNav'; // 1. Import the new component
import './Responsive.css'; // Add this line
import './components/BottomNav.css'; // 2. Import its CSS


import NotificationsSettings from "./pages/NotificationsSettings";
import DateTimeSettings      from "./pages/DateTimeSettings";
import WidgetsSettings       from "./pages/WidgetsSettings";
import GeneralSettings       from "./pages/GeneralSettings";
import IntegrationSettings   from "./pages/IntegrationSettings";
import HelpPage              from "./pages/HelpPage";
import AboutPage             from "./pages/AboutPage";
import TabBarSettings        from "./pages/TabBarSettings";

import "./index.css";

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [cookies, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const authToken = cookies.AuthToken;
  const userEmail = cookies.Email;
  const [isPremium, setIsPremium] = useState(false);

  const [isDarkMode, setIsDarkMode]     = useState(() => localStorage.getItem("darkMode")==="true");
  const [defaultPanel, setDefaultPanel] = useState(() => localStorage.getItem("defaultPanel")||"tasks");
  const [activePanel, setActivePanel]   = useState(defaultPanel);

  const [tasks, setTasks]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editTask, setEditTask]   = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [pomodoroTask, setPomodoroTask] = useState(null);

  const [filters, setFilters] = useState({
    list_name:    "All",
    status:       "All",
    is_urgent:    false,
    is_important: false,
    tags:         []
  });

  const getData = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/todos/${userEmail}`);
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message.indexOf('Session expired') === -1) {
        console.error("Error fetching todos:", err);
      }
      setTasks([]);
    }
  }, [userEmail]);

  useEffect(() => {
    if (authToken) {
      getData();
    } else {
      setTasks([]);
    }
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
        } catch (err) {
            // Error will be handled by authenticatedFetch (redirect)
        }
    })();
  }, [authToken]);
  
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
      if (!res.ok) {
        console.error("Failed to update task on server.");
        setTasks(originalTasks);
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setTasks(originalTasks);
    }
  }

  const handleMoveTask = (taskId, newList) => {
    updateTask(taskId, { list_name: newList });
  };

  const listOptions = useMemo(() => {
    const names = tasks.map(t => t.list_name||"General");
    return ["All", ...Array.from(new Set(names)).sort()];
  }, [tasks]);

  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (filters.list_name!=="All" && (t.list_name||"General")!==filters.list_name) return false;
    if (filters.status==="Completed" && t.progress<100) return false;
    if (filters.status==="Pending"   && t.progress===100) return false;
    if (filters.is_urgent    && !t.is_urgent) return false;
    if (filters.is_important && !t.is_important) return false;
    if (filters.tags.length > 0) {
      const ts = t.tags||[];
      const sel = filters.tags.map(x=>x.value);
      if (!sel.every(tag=>ts.includes(tag))) return false;
    }
    return true;
  }), [tasks, filters]);

  const handleSignOut = () => {
    removeCookie("Email", { path: "/" });
    removeCookie("AuthToken", { path: "/" });
    navigate("/login");
  };

  const openCreateModal = () => {
    setEditTask(null);
    setModalMode("create");
    setShowModal(true);
  };
  const openEditModal = task => {
    setEditTask(task);
    setModalMode("edit");
    setShowModal(true);
  };
  const handleShare = listId => {
    setActiveListId(listId);
    setModalMode("shareList");
    setShowModal(true);
  };

  const startPomodoroFor = task => {
    setPomodoroTask(task);
    setActivePanel("timer");
    setDefaultPanel("timer");
  };

  const handleReorder = reordered => setTasks(reordered);

  const MainApp = (
    <div className="app">
      <ListHeader listName={filters.list_name==="All" ? "TaskMaster" : filters.list_name} onShareClick={() => handleShare(filters.list_name)} toggleDashboard={()=>{setActivePanel(p=>p==="dashboard"?"tasks":"dashboard"); setDefaultPanel("dashboard");}} onSettingsClick={()=>{ setActivePanel("settings"); setDefaultPanel("settings"); }} onSignOut={handleSignOut} />
      <div className="controls">
        <button className="btn create" onClick={openCreateModal}>{t('Add_new')}</button>
        <button className="btn dashboard-toggle" onClick={()=>{setActivePanel(p=>p==="dashboard"?"tasks":"dashboard"); setDefaultPanel("dashboard");}}>{activePanel==="dashboard" ? "Hide Dashboard" : t('Dashboard')}</button>
        <button className="btn boards-toggle" onClick={()=>{ setActivePanel("boards"); setDefaultPanel("boards"); }}>{t('Boards')}</button>
        <button className="btn settings-toggle" onClick={()=>{ setActivePanel("timer"); setDefaultPanel("timer"); }}>{t('Timer')}</button>
        {isPremium ? (<button className="btn analytics-toggle" onClick={()=>{setActivePanel(p=>p==="analytics"?"tasks":"analytics"); setDefaultPanel("analytics");}}>{activePanel==="analytics" ? "Hide Analytics" : t('analytics')}</button>) : (<button className="btn analytics-toggle upgrade" onClick={()=>navigate("/settings/integration")}>{t('analytics')} 🔒</button>)}
      </div>
      <Filters filters={filters} setFilters={setFilters} listOptions={listOptions} tasks={tasks} />
      {activePanel==="dashboard" && <Dashboard tasks={filteredTasks} />}
      {activePanel==="boards"    && <KanbanBoard tasks={filteredTasks} onMove={handleMoveTask} />}
      {activePanel==="tasks"     && (<div className="task-list-container"><p className="welcome">{t('welcome_message')}, {userEmail}</p><TaskList tasks={filteredTasks} onReorder={handleReorder} onEdit={openEditModal} onStart={startPomodoroFor} onUpdateTask={updateTask} userEmail={userEmail}/></div>)}
      {activePanel==="timer"     && <Timer pomodoroTask={pomodoroTask} onTasksClick={()=>{ setActivePanel("tasks"); setDefaultPanel("tasks"); }} onCalendarClick={()=>{ setActivePanel("calendar"); setDefaultPanel("calendar"); }} onPriorityClick={()=>{ setActivePanel("priority"); setDefaultPanel("priority"); }} onTimerClick={()=>{ setActivePanel("timer"); setDefaultPanel("timer"); }} onSettingsClick={()=>{ setActivePanel("settings"); setDefaultPanel("settings"); }}/>}
      {activePanel==="calendar"  && <CalendarView tasks={tasks} />}
      {activePanel==="priority"  && <EisenhowerMatrix tasks={filteredTasks} onUpdateTask={updateTask} />}
      {activePanel==="settings"  && <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} filters={filters} setFilters={setFilters} listOptions={listOptions}/>}
      {activePanel==="analytics" && <AnalyticsDashboard isPremium={isPremium} />}
      {showModal && modalMode==="shareList" && (<ShareListModal listId={activeListId} onClose={()=>setShowModal(false)} />)}
      {showModal && modalMode!=="shareList" && (<Modal mode={modalMode} task={editTask} setShowModal={setShowModal} getData={getData} />)}
      <BottomNav activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
  
  if (!authToken) return <Auth />;

  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/settings/tab-bar" element={<TabBarSettings />} />
      <Route path="/settings/notifications" element={<NotificationsSettings />} />
      <Route path="/settings/date-time" element={<DateTimeSettings />} />
      <Route path="/settings/widgets" element={<WidgetsSettings />} />
      <Route path="/settings/general" element={<GeneralSettings />} />
      <Route path="/settings/integration" element={<IntegrationSettings />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/tasks/:taskId/comments" element={<CommentsSection />} />
      <Route path="/tasks/:taskId/activity" element={<ActivityLog />} />
      <Route path="/*" element={MainApp} />
    </Routes>
  );
}

export default App;
