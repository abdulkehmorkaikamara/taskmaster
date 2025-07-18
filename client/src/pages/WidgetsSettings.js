// src/pages/WidgetsSettings.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../api';
import './SettingsSubPage.css'; // Create a simple CSS file for styling

export default function WidgetsSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    showClock: true,
    showAnalyticsSummary: true,
    showUpcomingTasks: true,
  });
  const [status, setStatus] = useState(''); // To show 'Saving...' or 'Saved!'

  // Fetch current settings on load
  const fetchSettings = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/settings`);
      if (res.ok) {
        const data = await res.json();
        // Merge fetched settings with defaults to avoid errors if a setting is missing
        setSettings(prev => ({ ...prev, ...(data.widgets || {}) }));
      }
    } catch (err) {
      console.error("Failed to fetch widget settings:", err);
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
        body: JSON.stringify({ settings: { widgets: settings } }),
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
      setTimeout(() => setStatus(''), 2000); // Clear status message after 2 seconds
    }
  };

  return (
    <div className="settings-subpage">
      <header className="subpage-header">
        <button onClick={() => navigate(-1)}>&larr; Back</button>
        <h1>Widgets</h1>
      </header>
      
      <div className="settings-content">
        <p>Choose which widgets to display on your main dashboard.</p>
        
        <div className="settings-item checkbox-group">
          <label htmlFor="showClock">Show Clock Widget</label>
          <input
            id="showClock"
            type="checkbox"
            checked={settings.showClock}
            onChange={() => handleToggle('showClock')}
          />
        </div>

        <div className="settings-item checkbox-group">
          <label htmlFor="showAnalyticsSummary">Show Analytics Summary</label>
          <input
            id="showAnalyticsSummary"
            type="checkbox"
            checked={settings.showAnalyticsSummary}
            onChange={() => handleToggle('showAnalyticsSummary')}
          />
        </div>

        <div className="settings-item checkbox-group">
          <label htmlFor="showUpcomingTasks">Show Upcoming Tasks</label>
          <input
            id="showUpcomingTasks"
            type="checkbox"
            checked={settings.showUpcomingTasks}
            onChange={() => handleToggle('showUpcomingTasks')}
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
