// src/components/BottomNav.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, LayoutDashboard, Columns, Timer, Settings } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav({ activePanel, setActivePanel }) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'tasks', label: t('buttons.tasks', 'Tasks'), icon: <CheckSquare /> },
    { id: 'dashboard', label: t('buttons.dashboard', 'Dashboard'), icon: <LayoutDashboard /> },
    { id: 'boards', label: t('buttons.boards', 'Boards'), icon: <Columns /> },
    { id: 'timer', label: t('buttons.timer', 'Timer'), icon: <Timer /> },
    { id: 'settings', label: t('buttons.settings', 'Settings'), icon: <Settings /> },
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
