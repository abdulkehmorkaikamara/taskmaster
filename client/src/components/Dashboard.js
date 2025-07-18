// src/components/Dashboard.js

import React, { useContext, useMemo } from 'react';
import { PremiumContext } from '../context/PremiumContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  ResponsiveContainer as PieResponsive
} from 'recharts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
  ResponsiveContainer as BarResponsive,
  Cell as BarCell
} from 'recharts';
import './Dashboard.css';

export default function Dashboard({ tasks }) {
  const { isPremium } = useContext(PremiumContext);

  // Prepare pie-chart data
  const completed = tasks.filter(t => t.progress === 100).length;
  const pending   = tasks.length - completed;
  const pieData    = [
    { name: 'Completed', value: completed },
    { name: 'Pending',   value: pending }
  ];

  // Prepare bar-chart data (by list_name)
  const barData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const name = t.list_name || 'Default';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // Advanced analytics: monthly breakdown (premium-only)
  const monthlyData = useMemo(() => {
    if (!isPremium) return [];
    const map = {};
    tasks.forEach(t => {
      const key = new Date(t.date).toLocaleString('default', {
        month: 'short',
        year:  'numeric'
      });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks, isPremium]);

  const COLORS = ['#81c784', '#e57373', '#64b5f6', '#ffb74d'];

  return (
    <div className="charts-container">
      {/* Pie Chart: Task Status */}
      <div className="chart">
        <h4>Task Status</h4>
        <PieResponsive width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              dataKey="value"
              label
              animationDuration={800}
            >
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <PieTooltip />
          </PieChart>
        </PieResponsive>
      </div>

      {/* Bar Chart: Tasks by List */}
      <div className="chart">
        <h4>Tasks by List</h4>
        <BarResponsive width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <BarTooltip />
            <Bar dataKey="value" animationDuration={800}>
              {barData.map((entry, idx) => (
                <BarCell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </BarResponsive>
      </div>

      {/* Premium-only: Monthly Breakdown */}
      {isPremium ? (
        <div className="chart">
          <h4>Tasks by Month</h4>
          <BarResponsive width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <BarTooltip />
              <Bar dataKey="value" animationDuration={800}>
                {monthlyData.map((entry, idx) => (
                  <BarCell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </BarResponsive>
        </div>
      ) : (
        <div className="chart upgrade-hint">
          <h4>Advanced Analytics</h4>
          <p>Upgrade to Premium to unlock monthly breakdowns.</p>
        </div>
      )}
    </div>
  );
}
