// src/components/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard({ isPremium }) {
  const navigate = useNavigate();
  const [cookies] = useCookies(['Email', 'AuthToken']);
  const userEmail = cookies.Email;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [avgTime, setAvgTime] = useState(0);
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isPremium) {
        setError('Upgrade to Premium to unlock Advanced Analytics.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [productivityRes, streaksRes] = await Promise.all([
          fetch(
            `${process.env.REACT_APP_SERVERURL}/analytics/productivity?userEmail=${encodeURIComponent(userEmail)}`,
            { headers: { Authorization: `Bearer ${cookies.AuthToken}` } }
          ),
          fetch(
            `${process.env.REACT_APP_SERVERURL}/analytics/streaks?userEmail=${encodeURIComponent(userEmail)}`,
            { headers: { Authorization: `Bearer ${cookies.AuthToken}` } }
          )
        ]);

        if (!productivityRes.ok || !streaksRes.ok) {
          throw new Error('Failed to load analytics data.');
        }

        const productivityData = await productivityRes.json();
        const streaksData = await streaksRes.json();

        setData(productivityData.series || []);
        setAvgTime(productivityData.avgCompletionMinutes || 0);
        setStreaks(streaksData || { currentStreak: 0, longestStreak: 0 });

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isPremium, userEmail, cookies.AuthToken]);

  if (isLoading) {
    return <div className="loading-state">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="analytics-upgrade-banner">
        <h3>✧˚ Advanced Analytics</h3>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/profile')} // A better target would be a profile or billing page
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-grid">
        <div className="chart-container">
          <h3>Completed vs. Pending Tasks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line type="monotone" dataKey="completed" stroke="var(--primary)" name="Completed" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" stroke="var(--danger)" name="Pending" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-column">
          <div className="stat-card">
            <h4>Avg. Completion Time</h4>
            <p className="stat-value">{avgTime.toFixed(1)} min</p>
          </div>
          <div className="stat-card">
            <h4>Current Streak</h4>
            <p className="stat-value">{streaks.currentStreak} days 🚀</p>
          </div>
          <div className="stat-card">
            <h4>Longest Streak</h4>
            <p className="stat-value">{streaks.longestStreak} days 🏆</p>
          </div>
        </div>
      </div>
    </div>
  );
}