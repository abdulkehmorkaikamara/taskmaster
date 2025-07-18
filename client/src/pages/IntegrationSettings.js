// src/pages/IntegrationSettings.js
import React from 'react';
import { useCookies } from 'react-cookie';
import './IntegrationSettings.css';

export default function IntegrationSettings() {
  const [cookies] = useCookies(['Email']);
  const userEmail = encodeURIComponent(cookies.Email);
  const base = process.env.REACT_APP_SERVERURL;


  return (
    <div className="integration-settings">
      <h1>Import & Integration</h1>

      {/* ── Calendar Sync buttons (already present) ── */}
      <section className="integration-section">
        <h2>Calendar Sync</h2>
        <button onClick={() => window.location.href = '/integrations/google/connect'}>
          Connect Google Calendar
        </button>
        {/* …other integration UIs… */}
      </section>

      {/* ── Export section ── */}
      <section className="integration-section">
        <h2>Export Your Tasks</h2>
        <p>Download all of your to-dos in CSV or iCal format:</p>
        <div className="export-buttons">
          <a
          className="btn export-csv"
          href={`${base}/export/tasks.csv?userEmail=${userEmail}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download CSV
        </a>

        <a
          className="btn export-ical"
          href={`${base}/export/tasks.ics?userEmail=${userEmail}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download iCal
        </a>
        </div>
      </section>

      {/* ── Webhooks & API section (if desired) ── */}
      <section className="integration-section">
        <h2>Webhooks & API</h2>
        <p>Register a webhook or grab your API key:</p>
        {/* your form/UI here */}
      </section>
    </div>
  );
}
