// src/pages/NotificationsSettings.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../api';
import './SettingsSubPage.css'; // We can reuse the same CSS

export default function NotificationsSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    taskReminders: true,
    emailNotifications: true,
    completionSounds: true,
  });
  const [status, setStatus] = useState('');

  // Fetch current settings on load
  const fetchSettings = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/settings`);
      if (res.ok) {
        const data = await res.json();
        // Merge fetched settings with defaults
        setSettings(prev => ({ ...prev, ...(data.notifications || {}) }));
      }
    } catch (err) {
      console.error("Failed to fetch notification settings:", err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: { notifications: settings } }),
      });
      if (res.ok) {
        setStatus('Settings saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setStatus('Save failed. Please try again.');
      console.error("Save error:", err);
    } finally {
      setTimeout(() => setStatus(''), 2000);
    }
  };

  return (
    <div className="settings-subpage">
      <header className="subpage-header">
        <button onClick={() => navigate(-1)}>&larr; {t('')}</button>
        <h1>Sounds & Notifications</h1>
      </header>
      
      <div className="settings-content">
        <p>Manage how you receive alerts and sound notifications.</p>
        
        <div className="settings-item checkbox-group">
          <label htmlFor="taskReminders">Upcoming Task Reminders</label>
          <input
            id="taskReminders"
            type="checkbox"
            checked={settings.taskReminders}
            onChange={() => handleToggle('taskReminders')}
          />
        </div>

        <div className="settings-item checkbox-group">
          <label htmlFor="emailNotifications">Receive Email Notifications</label>
          <input
            id="emailNotifications"
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
          />
        </div>

        <div className="settings-item checkbox-group">
          <label htmlFor="completionSounds">Task Completion Sounds</label>
          <input
            id="completionSounds"
            type="checkbox"
            checked={settings.completionSounds}
            onChange={() => handleToggle('completionSounds')}
          />
        </div>

        <div className="subpage-actions">
            <button className="btn-save" onClick={handleSave}>Save Changes</button>
            {status && <span className="save-status">{status}</span>}
        </div>
      </div>
    </div>
  );
}
