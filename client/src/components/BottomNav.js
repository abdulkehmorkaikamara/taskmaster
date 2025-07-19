// src/components/BottomNav.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, LayoutDashboard, Columns, Timer, Settings, BarChart2, Calendar } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav({ activePanel, setActivePanel }) {
  const { t } = useTranslation();

  // The navItems array now correctly includes Dashboard and Timer
  const navItems = [
    { id: 'tasks', label: t('buttons.tasks', 'Tasks'), icon: <CheckSquare size={24} /> },
    { id: 'dashboard', label: t('buttons.dashboard', 'Dashboard'), icon: <LayoutDashboard size={24} /> },
    { id: 'boards', label: t('buttons.boards', 'Boards'), icon: <Columns size={24} /> },
    { id: 'timer', label: t('buttons.timer', 'Timer'), icon: <Timer size={24} /> },
    { id: 'calendar', label: t('buttons.calendar', 'Calendar'), icon: <Calendar size={24} /> },
    { id: 'analytics', label: t('buttons.analytics', 'Analytics'), icon: <BarChart2 size={24} /> },
    { id: 'settings', label: t('buttons.settings', 'Settings'), icon: <Settings size={24} /> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
          onClick={() => setActivePanel(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
