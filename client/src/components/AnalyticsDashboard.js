// src/components/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate }             from 'react-router-dom';
import { useCookies }              from 'react-cookie';
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard({ isPremium }) {
  const navigate    = useNavigate();
  const [cookies]   = useCookies(['Email','AuthToken']);
  const userEmail   = cookies.Email;
  const [error, setError]           = useState(null);
  const [data, setData]             = useState([]);
  const [avgTime, setAvgTime]       = useState(0);
  const [streaks, setStreaks]       = useState({ currentStreak: 0, longestStreak: 0 });

  useEffect(() => {
    if (!isPremium) {
      setError('Upgrade to Premium to unlock Advanced Analytics.');
      return;
    }
    setError(null);

    // 1️⃣ Productivity series + avg time
    fetch(
      `${process.env.REACT_APP_SERVERURL}/analytics/productivity?userEmail=${encodeURIComponent(userEmail)}`,
      { headers: { Authorization: `Bearer ${cookies.AuthToken}` } }
    )
      .then(r => r.json())
      .then(json => {
        setData(json.series);
        setAvgTime(json.avgCompletionMinutes);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load analytics data.');
      });

    // 2️⃣ Streaks
    fetch(
      `${process.env.REACT_APP_SERVERURL}/analytics/streaks?userEmail=${encodeURIComponent(userEmail)}`,
      { headers: { Authorization: `Bearer ${cookies.AuthToken}` } }
    )
      .then(r => r.json())
      .then(setStreaks)
      .catch(err => {
        console.error(err);
        // we can still show the rest
      });
  }, [isPremium, userEmail, cookies.AuthToken]);

  if (error) {
    return (
      <div className="analytics-upgrade-banner">
        <p>{error}</p>
        <button
          className="btn-upgrade"
          onClick={() => navigate('/settings/integration')}
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <h2>Productivity Overview</h2>

      <div className="analytics-grid">
        {/* Completed vs. Pending */}
        <div className="chart-container">
          <h3>Completed vs. Pending Tasks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="day" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line type="monotone" dataKey="completed" stroke="var(--success)" name="Completed" />
              <Line type="monotone" dataKey="pending"   stroke="var(--danger)"  name="Pending"   />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats cards */}
        <div className="stats-column">
          <div className="stat-card">
            <h4>Avg Completion Time</h4>
            <p>{avgTime.toFixed(1)} min</p>
          </div>
          <div className="stat-card">
            <h4>Current Streak</h4>
            <p>{streaks.currentStreak} days 🚀</p>
          </div>
          <div className="stat-card">
            <h4>Longest Streak</h4>
            <p>{streaks.longestStreak} days 🏆</p>
          </div>
        </div>
      </div>

      {/* Tasks by weekday */}
      <div className="chart-small">
        <h3>Tasks Completed by Weekday</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data.map(d => ({
              day: new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' }),
              completed: d.completed
            }))}
            barCategoryGap="20%"
          >
            <XAxis dataKey="day" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Bar dataKey="completed" fill="var(--accent)" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
