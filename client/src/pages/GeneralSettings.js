// src/pages/GeneralSettings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
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

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.resolvedLanguage);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedLanguage(i18n.resolvedLanguage);
  }, [i18n.resolvedLanguage]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('Saving...');
    try {
      await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: { language: selectedLanguage } }),
      });
      i18n.changeLanguage(selectedLanguage);
      setStatus('Settings saved successfully!');
    } catch (err) {
      setStatus('Save failed. Please try again.');
      console.error("Failed to save language preference:", err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="settings-subpage">
      <header className="subpage-header">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t('back', 'Back')}
        </button>
        <h1>{t('general_settings', 'General Settings')}</h1>
      </header>
      
      <div className="settings-content">
        <div className="settings-item">
          <label htmlFor="language-select">{t('language', 'Language')}</label>
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
            {status && <span className="save-status">{status}</span>}
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
            </button>
        </div>
      </div>
    </div>
  );
}