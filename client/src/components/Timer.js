/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "./Timer.css";

const Timer = ({
  onTasksClick,
  onCalendarClick,
  onPriorityClick,
  onTimerClick,
  onSettingsClick
}) => {
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [pomoTime, setPomoTime]         = useState(25 * 60);
  const [pomoRunning, setPomoRunning]   = useState(false);
  const [pomoMode, setPomoMode]         = useState("work");
  const [stopwatchTime, setStopwatchTime]       = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  // Pomodoro interval
  useEffect(() => {
    let id;
    if (pomoRunning) {
      id = setInterval(() => {
        setPomoTime(prev => {
          if (prev <= 1) {
            clearInterval(id);
            handlePomoSwitch();
            return prev;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(id);
  }, [pomoRunning]);

  const handlePomoSwitch = () => {
    if (pomoMode === "work") {
      setPomoMode("break");
      setPomoTime(5 * 60);
    } else {
      setPomoMode("work");
      setPomoTime(25 * 60);
    }
    setPomoRunning(false);
  };

  // Stopwatch interval
  useEffect(() => {
    let id;
    if (stopwatchRunning) {
      id = setInterval(() => {
        setStopwatchTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(id);
  }, [stopwatchRunning]);

  const formatTime = sec => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // SVG ring maths
  const R       = 140;
  const STROKE  = 8;
  const radius  = R - STROKE * 2;
  const circ    = radius * 2 * Math.PI;
  const total   = pomoMode === "work" ? 25 * 60 : 5 * 60;
  const offset  = circ - (pomoTime / total) * circ;

  return (
    <div className="timer-container">
      <div className="timer-tabs">
        <button
          className={activeTab === "pomodoro" ? "active" : ""}
          onClick={() => setActiveTab("pomodoro")}
        >
          Pomo
        </button>
        <button
          className={activeTab === "stopwatch" ? "active" : ""}
          onClick={() => setActiveTab("stopwatch")}
        >
          Stopwatch
        </button>
      </div>

      {activeTab === "pomodoro" && (
        <>
          <div className="circular-ring">
            <svg width={R * 2} height={R * 2}>
              <circle
                stroke="#333"
                fill="transparent"
                strokeWidth={STROKE}
                r={radius}
                cx={R}
                cy={R}
              />
              <circle
                stroke="#ff8c00"
                fill="transparent"
                strokeWidth={STROKE}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                r={radius}
                cx={R}
                cy={R}
              />
            </svg>
            <div className="timer-text">
              {formatTime(pomoTime)}
            </div>
          </div>
          <button
            className="start-btn"
            onClick={() => setPomoRunning(r => !r)}
          >
            {pomoRunning ? "Pause" : "Start"}
          </button>
        </>
      )}

      {activeTab === "stopwatch" && (
        <>
          <div className="timer-text" style={{ fontSize:  "32px" }}>
            {new Date(stopwatchTime * 1000)
              .toISOString()
              .substr(11, 8)}
          </div>
          <button
            className="start-btn"
            onClick={() => setStopwatchRunning(r => !r)}
          >
            {stopwatchRunning ? "Pause" : "Start"}
          </button>
        </>
      )}

      <div className="bottom-nav">
        <button onClick={onTasksClick}>✔︎</button>
        <button onClick={onCalendarClick}>📅</button>
        <button onClick={onPriorityClick}>⋯</button>
        <button
          className="active"
          onClick={onTimerClick}
        >
          ●
        </button>
        <button onClick={onSettingsClick}>⚙︎</button>
      </div>
    </div>
  );
};

export default Timer;
