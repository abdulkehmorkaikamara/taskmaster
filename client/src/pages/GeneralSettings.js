// src/pages/GeneralSettings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../api';
import './SettingsSubPage.css';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'el', name: 'Ελληνικά (Greek)' },
  // Add other languages here
];

export default function GeneralSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Local state to hold the selected language before saving
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.resolvedLanguage);
  const [status, setStatus] = useState('');

  // Update local state if the global language changes (e.g., via browser detector)
  useEffect(() => {
    setSelectedLanguage(i18n.resolvedLanguage);
  }, [i18n.resolvedLanguage]);

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      // 1. Save the preference to the user's settings in the database
      await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: { language: selectedLanguage } }),
      });

      // 2. Change the language in the UI *after* successful save
      i18n.changeLanguage(selectedLanguage);
      
      setStatus('Settings saved successfully!');
    } catch (err) {
      setStatus('Save failed. Please try again.');
      console.error("Failed to save language preference:", err);
    } finally {
      setTimeout(() => setStatus(''), 2000);
    }
  };

  return (
    <div className="settings-subpage">
      <header className="subpage-header">
        <button onClick={() => navigate(-1)}>&larr; {t('')}</button>
        <h1>{t('General')}</h1>
      </header>
      
      <div className="settings-content">
        <div className="settings-item">
          <label htmlFor="language-select">{t('language')}</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="subpage-actions">
            <button className="btn-save" onClick={handleSave}>Save Changes</button>
            {status && <span className="save-status">{status}</span>}
        </div>
      </div>
    </div>
  );
}
