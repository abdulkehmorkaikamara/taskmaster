// src/components/Dashboard.js

import React, { useContext, useMemo } from 'react';
import { PremiumContext } from '../context/PremiumContext';
import { Lock } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import './Dashboard.css';

export default function Dashboard({ tasks, onBack }) {
  const { isPremium } = useContext(PremiumContext);

  const completed = tasks.filter(t => t.progress === 100).length;
  const pending   = tasks.length - completed;
  const pieData    = [
    { name: 'Completed', value: completed },
    { name: 'Pending',   value: pending }
  ];

  const barData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const name = t.list_name || 'Default';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const monthlyData = useMemo(() => {
    if (!isPremium) return [];
    const map = {};
    tasks.forEach(t => {
      // FIX: Use 'start_at' which is the correct property from your tasks
      if (!t.start_at) return;
      const key = new Date(t.start_at).toLocaleString('default', {
        month: 'short',
        year:  'numeric'
      });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks, isPremium]);

  const COLORS = ['#81c784', '#e57373', '#64b5f6', '#ffb74d'];

  return (
    <div className="dashboard-container">
      <button className="btn btn-outline back-button" onClick={onBack}>&larr; Back to Tasks</button>

      <div className="dashboard-card">
        <h4>Task Status</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-card">
        <h4>Tasks by List</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" animationDuration={800}>
              {barData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isPremium ? (
        <div className="dashboard-card">
          <h4>Tasks by Month</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" animationDuration={800}>
                {monthlyData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="dashboard-card upgrade-hint">
          <Lock size={28} className="icon-premium" />
          <h4>Advanced Analytics</h4>
          <p>Upgrade to Premium to see monthly breakdowns and more.</p>
          <button className="btn btn-primary">Upgrade</button>
        </div>
      )}
    </div>
  );
}