// src/components/ListHeader.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import './ListHeader.css'; // We will use CSS to hide this on mobile

export default function ListHeader({ listName, onSignOut, onSettingsClick, onShareClick }) {
  const { t } = useTranslation();

  return (
    <header className="list-header">
      <div className="title-container">
        <span className="sparkle">✧˚</span>
        <h1>{listName.includes("TaskMaster") ? "TaskMaster" : listName}</h1>
        <span className="sparkle">˚✧</span>
      </div>
      <div className="button-container">
        <button className="btn-header" onClick={onShareClick}>{t('buttons.share', 'Share')}</button>
        <button className="btn-header" onClick={() => alert('Profile page')}>{t('buttons.profile', 'Profile')}</button>
        <button className="btn-header" onClick={onSettingsClick}>{t('buttons.settings', 'Settings')}</button>
        <button className="btn-header signout" onClick={onSignOut}>{t('buttons.signout', 'Sign Out')}</button>
      </div>
    </header>
  );
}
