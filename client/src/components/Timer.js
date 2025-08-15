// src/components/Timer.js
import React, { useEffect, useState, useRef } from "react";
import "./Timer.css";
import alertSound from "../assets/done.mp3";
import clockSound from "../assets/clock.mp3";
import boilingSound from "../assets/boiling.mp3";
import woodenfishSound from "../assets/woodenfish.mp3";
import stormSound from "../assets/storm.mp3";
import rainSound from "../assets/rain.mp3";
import pianoSound from "../assets/piano.mp3"

const soundMap = {
  none: null,
  clock: clockSound,
  boiling: boilingSound,
  woodenfish: woodenfishSound,
  storm: stormSound,
  rain: rainSound,
  piano:pianoSound
};

const Timer = ({ pomodoroTask, onBack }) => {
  const [activeTab, setActiveTab] = useState("pomodoro");

  // Pomodoro State
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [pomoTime, setPomoTime] = useState(workDuration);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState("work");
  const [isSelectingTime, setIsSelectingTime] = useState(false);

  // Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  // Shared State
  const [selectedSound, setSelectedSound] = useState("none");
  const [displayText, setDisplayText] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  
  const ambientAudio = useRef(null);

  useEffect(() => {
    if (pomodoroTask) {
      setDisplayText(pomodoroTask.title);
      setFocusNote(pomodoroTask.title);
    } else {
      setDisplayText("your next task");
    }
  }, [pomodoroTask]);

  useEffect(() => {
    if (pomoRunning && selectedSound !== "none") {
      ambientAudio.current = new Audio(soundMap[selectedSound]);
      ambientAudio.current.loop = true;
      ambientAudio.current.volume = 0.5;
      ambientAudio.current.play().catch(() => {});
    } else if (ambientAudio.current) {
      ambientAudio.current.pause();
      ambientAudio.current = null;
    }
    return () => {
      if (ambientAudio.current) {
        ambientAudio.current.pause();
        ambientAudio.current = null;
      }
    };
  }, [pomoRunning, selectedSound]);

  useEffect(() => {
    let id;
    if (activeTab === "pomodoro" && pomoRunning) {
      id = setInterval(() => {
        setPomoTime(prev => {
          if (prev <= 1) {
            clearInterval(id);
            new Audio(alertSound).play().catch(() => {});
            handlePomoSwitch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(id);
  }, [pomoRunning, activeTab]);

  const handlePomoSwitch = () => {
    setPomoRunning(false);
    setPomoMode(prev => {
      if (prev === "work") {
        setPomoTime(breakDuration);
        return "break";
      } else {
        setPomoTime(workDuration);
        return "work";
      }
    });
  };

  useEffect(() => {
    let id;
    if (activeTab === "stopwatch" && stopwatchRunning) {
      id = setInterval(() => {
        setStopwatchTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(id);
  }, [stopwatchRunning, activeTab]);

  const handleSaveNote = () => {
    setDisplayText(focusNote);
    setIsEditingNote(false);
  };

  const handleDurationSelect = (minutes, mode) => {
    const newDurationInSeconds = minutes * 60;
    if (mode === 'work') {
      setWorkDuration(newDurationInSeconds);
      if (pomoMode === 'work') {
        setPomoTime(newDurationInSeconds);
      }
    } else { // mode === 'break'
      setBreakDuration(newDurationInSeconds);
      if (pomoMode === 'break') {
        setPomoTime(newDurationInSeconds);
      }
    }
    setIsSelectingTime(false);
  };

  const formatTime = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const R = 140;
  const STROKE = 12;
  const radius = R - STROKE;
  const circ = radius * 2 * Math.PI;
  const total = pomoMode === "work" ? workDuration : breakDuration;
  const offset = circ - (pomoTime / total) * circ;

  return (
    <div className="timer-container">
      <button className="btn btn-outline back-button" onClick={onBack}>
        &larr; Back to Tasks
      </button>

      <div className="timer-tabs">
        <button
          className={`btn ${activeTab === 'pomodoro' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab("pomodoro")}
        >
          Pomodoro
        </button>
        <button
          className={`btn ${activeTab === 'stopwatch' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab("stopwatch")}
        >
          Stopwatch
        </button>
      </div>

      {activeTab === "pomodoro" && (
        <div className="pomodoro-panel">
          <p className="pomo-task-title">Working on: <strong>{displayText}</strong></p>

          <div className="circular-ring" onClick={() => setIsSelectingTime(true)}>
            <svg width={R * 2} height={R * 2} className="timer-svg">
              <circle className="ring-bg" strokeWidth={STROKE} r={radius} cx={R} cy={R} />
              <circle
                className="ring-fg"
                strokeWidth={STROKE}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                r={radius}
                cx={R}
                cy={R}
              />
            </svg>
            <div className="timer-text">{formatTime(pomoTime)}</div>
          </div>

          <div className="focus-note">
            {isEditingNote ? (
              <>
                <label htmlFor="focus">Focus Note</label>
                <textarea
                  id="focus"
                  rows="3"
                  placeholder="What will you focus on during this session?"
                  value={focusNote}
                  onChange={(e) => setFocusNote(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleSaveNote}>
                  Save Note
                </button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsEditingNote(true)}>
                Edit Focus Note
              </button>
            )}
          </div>

          <div className="pomo-controls">
            <button className="btn btn-primary start-button" onClick={() => setPomoRunning(r => !r)}>
              {pomoRunning ? "Pause" : "Start"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setPomoRunning(false);
                setPomoMode("work");
                setPomoTime(workDuration);
                setFocusNote(pomodoroTask ? pomodoroTask.title : "");
                setDisplayText(pomodoroTask ? pomodoroTask.title : "your next task");
              }}
            >
              Reset
            </button>
            <select className="sound-select" value={selectedSound} onChange={e => setSelectedSound(e.target.value)}>
              <option value="none">🔇 Sound: None</option>
              <option value="clock">🕰️ Clock</option>
              <option value="boiling">🔥 Boiling</option>
              <option value="woodenfish">🐟 Wooden Fish</option>
              <option value="storm">🌩️ Storm</option>
              <option value="rain">🌧️ Rain</option>
              <option value="piano">🎹 Piano (Meditation)</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === "stopwatch" && (
        <div className="stopwatch-panel">
          <div className="timer-text large">
            {new Date(stopwatchTime * 1000).toISOString().substr(11, 8)}
          </div>
          <button className="btn btn-primary start-button" onClick={() => setStopwatchRunning(r => !r)}>
            {stopwatchRunning ? "Pause" : "Start"}
          </button>
        </div>
      )}

      {isSelectingTime && (
        <div className="time-selector-overlay" onClick={() => setIsSelectingTime(false)}>
          <div className="time-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Set Work Duration (minutes)</h4>
            <div className="duration-buttons">
              {[15, 25, 45, 60].map(min => (
                <button
                  key={`work-${min}`}
                  className="btn btn-secondary"
                  onClick={() => handleDurationSelect(min, 'work')}
                >
                  {min}
                </button>
              ))}
            </div>
            <h4>Set Break Duration (minutes)</h4>
            <div className="duration-buttons">
              {[5, 10, 15, 20].map(min => (
                <button
                  key={`break-${min}`}
                  className="btn btn-secondary"
                  onClick={() => handleDurationSelect(min, 'break')}
                >
                  {min}
                </button>
              ))}
            </div>
            <button className="btn btn-outline" onClick={() => setIsSelectingTime(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;