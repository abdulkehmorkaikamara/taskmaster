import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Dashboard = ({ tasks }) => {
  const [reportType, setReportType] = useState("weekly");
  const [filteredTasks, setFilteredTasks] = useState({ completed: [], pending: [] });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    if (tasks) {
      const now = new Date();
      let completed = [];
      let pending = [];

      const isInRange = (taskDate, start, end) => {
        const date = new Date(taskDate);
        return date >= start && date <= end;
      };

      if (reportType === "daily") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        completed = tasks.filter(task =>
          task.progress === 100 && new Date(task.date).toDateString() === today.toDateString()
        );
        pending = tasks.filter(task =>
          task.progress < 100 && new Date(task.date).toDateString() === today.toDateString()
        );
      } else if (reportType === "weekly") {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        completed = tasks.filter(task => task.progress === 100 && new Date(task.date) > lastWeek);
        pending = tasks.filter(task => task.progress < 100 && new Date(task.date) > lastWeek);
      } else if (reportType === "monthly") {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        completed = tasks.filter(task => task.progress === 100 && new Date(task.date) > lastMonth);
        pending = tasks.filter(task => task.progress < 100 && new Date(task.date) > lastMonth);
      } else if (reportType === "yearly") {
        const lastYear = new Date(now);
        lastYear.setFullYear(now.getFullYear() - 1);
        completed = tasks.filter(task => task.progress === 100 && new Date(task.date) > lastYear);
        pending = tasks.filter(task => task.progress < 100 && new Date(task.date) > lastYear);
      } else if (reportType === "custom") {
        completed = tasks.filter(task => task.progress === 100 && isInRange(task.date, startDate, endDate));
        pending = tasks.filter(task => task.progress < 100 && isInRange(task.date, startDate, endDate));
      }

      setFilteredTasks({ completed, pending });
    }
  }, [reportType, tasks, startDate, endDate]);

  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div className="dashboard fade-in">
      <h2>📊 Task Overview</h2>

      <div className="report-buttons">
        <button onClick={() => setReportType("daily")}>📆 Daily</button>
        <button onClick={() => setReportType("custom")}>📅 Custom</button>
        <button onClick={() => setReportType("weekly")}>📅 Weekly</button>
        <button onClick={() => setReportType("monthly")}>📅 Monthly</button>
        <button onClick={() => setReportType("yearly")}>📅 Yearly</button>
      </div>

      {reportType === "custom" && (
        <div className="custom-date-picker">
          <label>From: </label>
          <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
          <label>To: </label>
          <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} minDate={startDate} />
        </div>
      )}

      <div className="charts-container">
        <div className="chart">
          <h3>Task Completion</h3>
          <PieChart width={250} height={250}>
            <Pie
              data={[
                { name: "Completed", value: filteredTasks.completed.length },
                { name: "Pending", value: filteredTasks.pending.length }
              ]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {[0, 1].map((index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="chart">
          <h3>Progress Breakdown</h3>
          <BarChart width={300} height={250} data={[...filteredTasks.completed, ...filteredTasks.pending]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="progress" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      <div className="task-list">
        <h3>✅ Completed Tasks</h3>
        <ul>{filteredTasks.completed.map(task => <li key={task.id}>{task.title}</li>)}</ul>

        <h3>⚠️ Pending Tasks</h3>
        <ul>{filteredTasks.pending.map(task => <li key={task.id}>{task.title}</li>)}</ul>
      </div>
    </div>
  );
};

export default Dashboard;
