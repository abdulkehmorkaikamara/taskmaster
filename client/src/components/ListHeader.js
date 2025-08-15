// src/components/ListHeader.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import './ListHeader.css'; // You may be able to simplify this file now

export default function ListHeader({ listName, onSignOut, onSettingsClick, onShareClick }) {
  const { t } = useTranslation();

  return (
    // UPDATE: Applied .page-header for consistent background, padding, and shadow.
    <header className="list-header page-header">
      <div className="title-container">
        <h1>{listName.includes("TaskMaster") ? "TaskMaster" : listName}</h1>
      </div>

      <div className="button-container">
        {/* UPDATE: Replaced .btn-header with the new, consistent button classes. */}
        <button className="btn btn-outline" onClick={onShareClick}>
          {t('buttons.share', 'Share')}
        </button>
        <button className="btn btn-outline" onClick={() => alert('Profile page')}>
          {t('buttons.profile', 'Profile')}
        </button>
        <button className="btn btn-outline" onClick={onSettingsClick}>
          {t('buttons.settings', 'Settings')}
        </button>
        <button className="btn btn-outline" onClick={onSignOut}>
          {t('buttons.signout', 'Sign Out')}
        </button>
      </div>
    </header>
  );
}