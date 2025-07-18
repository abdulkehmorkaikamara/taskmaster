import React, { useState, useEffect } from 'react';

export default function DateTimeSettings() {
  const [settings, setSettings] = useState({
    timezone:   'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStart:  'Monday',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVERURL}/settings/date-time`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/settings/date-time`,
        {
          method:      'PUT',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify(settings),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      alert('Date & Time settings saved!');
    } catch (err) {
      console.error(err);
      alert('Save failed: ' + err.message);
    }
  };

  if (loading) return <p>Loading…</p>;
  return (
    <div>
      <h1>Date &amp; Time</h1>
      <div>
        <label>
          Timezone:{' '}
          <input
            type="text"
            value={settings.timezone}
            onChange={e =>
              setSettings(s => ({ ...s, timezone: e.target.value }))
            }
          />
        </label>
      </div>
      <div>
        <label>
          Date Format:{' '}
          <input
            type="text"
            value={settings.dateFormat}
            onChange={e =>
              setSettings(s => ({ ...s, dateFormat: e.target.value }))
            }
          />
        </label>
      </div>
      <div>
        <label>
          Time Format:{' '}
          <select
            value={settings.timeFormat}
            onChange={e =>
              setSettings(s => ({ ...s, timeFormat: e.target.value }))
            }
          >
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Week starts on:{' '}
          <select
            value={settings.weekStart}
            onChange={e =>
              setSettings(s => ({ ...s, weekStart: e.target.value }))
            }
          >
            <option>Sunday</option>
            <option>Monday</option>
          </select>
        </label>
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
