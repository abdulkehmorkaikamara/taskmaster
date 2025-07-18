// src/components/SettingsPage.js
import React, { useState, useEffect, useContext } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import {
  Crown, Grid, Brush, Music, Clock, LayoutGrid, Settings as Cog,
  Share2, MessageSquare, User, Info
} from "lucide-react";
import ThemePicker from "../components/ThemePicker";
import { PremiumContext } from "../context/PremiumContext";
import "./SettingsPage.css";

const inboundEmailAddress = process.env.REACT_APP_INBOUND_EMAIL;

export default function SettingsPage({
  filters, setFilters, listOptions, isDarkMode, setIsDarkMode,
}) {
  const { isPremium, upgradeToPremium } = useContext(PremiumContext);
  const [cookies, , removeCookie] = useCookies(["Email", "AuthToken", "UserName", "UserAvatar"]);
  const navigate = useNavigate();

  // Profile state
  const [profileName, setProfileName] = useState(cookies.UserName || "");
  const [avatarUrl, setAvatarUrl] = useState(cookies.UserAvatar || "/default-avatar.png");
  
  // Gamification state
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState([]);

  // Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");

  // Fetch Gamification Data
  useEffect(() => {
    if (!cookies.AuthToken) return;
    fetch(`${process.env.REACT_APP_SERVERURL}/gamification/status?userEmail=${cookies.Email}`, {
        headers: { Authorization: `Bearer ${cookies.AuthToken}` },
    })
    .then(res => res.json())
    .then(data => {
        if (data) {
            setLevel(data.level || 1);
            setBadges(data.badges || []);
        }
    })
    .catch(err => console.error("Failed to fetch gamification status:", err));
  }, [cookies.AuthToken, cookies.Email]);

  // Fetch Calendar Status
  useEffect(() => {
    if (!isPremium || !cookies.AuthToken) return;
    fetch(`${process.env.REACT_APP_SERVERURL}/auth/calendar/status`, {
      headers: { Authorization: `Bearer ${cookies.AuthToken}` },
    })
      .then((r) => r.json())
      .then(({ connected, email }) => {
        setCalendarConnected(connected);
        setCalendarEmail(email || "");
      })
      .catch(() => {});
  }, [cookies.AuthToken, isPremium]);

  // Helper functions
  const handleNameBlur = () => {
    document.cookie = `UserName=${encodeURIComponent(profileName)};path=/`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      document.cookie = `UserAvatar=${encodeURIComponent(dataUrl)};path=/`;
    };
    reader.readAsDataURL(file);
  };

  const handleConnectCalendar = () =>
    (window.location.href = `${process.env.REACT_APP_SERVERURL}/integrations/google/connect`);

  const handleDisconnectCalendar = () => {
    fetch(`${process.env.REACT_APP_SERVERURL}/auth/calendar/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cookies.AuthToken}` },
    }).then((r) => {
      if (r.ok) {
        setCalendarConnected(false);
        setCalendarEmail("");
      }
    });
  };

  const handleListChange = (e) => setFilters((f) => ({ ...f, list_name: e.target.value }));
  const handleStatusChange = (e) => setFilters((f) => ({ ...f, status: e.target.value }));
  const handleToggle = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const go = (p) => navigate(p);
  const handleTabBar = () => go("/settings/tab-bar");
  const handleSounds = () => go("/settings/notifications");
  const handleDateTime = () => go("/settings/date-time");
  const handleWidgets = () => go("/settings/widgets");
  const handleGeneral = () => go("/settings/general");
  const handleImport = () => go("/settings/integration");
  const handleHelp = () => go("/help");
  const handleFollow = () => window.open("https://twitter.com/yourhandle", "_blank");
  const handleAbout = () => go("/about");

  const signOut = () => {
    ["Email", "AuthToken", "UserName", "UserAvatar"].forEach((c) => removeCookie(c, { path: "/" }));
    navigate("/login");
  };

  return (
    <div className="settings-page">
      <div className="settings-profile">
        <div className="avatar-container">
          <img src={avatarUrl} alt="avatar" className="settings-avatar" />
          <label htmlFor="avatarUpload" className="upload-overlay">✎</label>
          <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="avatar-input" />
        </div>
        <div className="settings-userinfo">
          <input
            className="profile-name-input"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Enter your name"
          />
          <div className="settings-badges">
            <button className="badge level">Lv.{level}</button>
            <div className="badge-container">
              <button className="badge">{badges.length} Badges</button>
              <div className="badge-tooltip">
                {badges.length > 0 ? (
                  <ul>{badges.map(b => <li key={b.name}><strong>{b.name}:</strong> {b.description}</li>)}</ul>
                ) : (<p>Complete tasks to earn badges!</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="settings-upgrade">
          <Crown className="icon" />
          <div className="upgrade-text">
            <strong>Upgrade to Premium</strong>
            <small>Calendar view and more functions</small>
          </div>
          <button className="btn-upgrade" onClick={upgradeToPremium}>Upgrade</button>
        </div>
      )}

      <div className="settings-group">
        <h3 className="settings-group-title">Email to Task</h3>
        <p>Forward any email to:</p>
        <code>{inboundEmailAddress}</code>
        <small>and it will appear as a new to-do.</small>
      </div>

      {isPremium && (
        <div className="settings-group">
          <h3 className="settings-group-title">Calendar Sync</h3>
          {calendarConnected ? (
            <>
              <span>Connected as {calendarEmail}</span>
              <button onClick={handleDisconnectCalendar}>Disconnect</button>
            </>
          ) : (
            <button onClick={handleConnectCalendar}>Connect Google/Outlook</button>
          )}
        </div>
      )}

      <div className="settings-group">
        <h3 className="settings-group-title">Filters</h3>
        <div className="settings-item">
          <label htmlFor="list-select">List:</label>
          <select id="list-select" value={filters.list_name} onChange={handleListChange}>
            {listOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="settings-item">
          <label htmlFor="status-select">Status:</label>
          <select id="status-select" value={filters.status} onChange={handleStatusChange}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="settings-item checkbox-group">
          <input id="urgent-toggle" type="checkbox" checked={filters.is_urgent} onChange={() => handleToggle("is_urgent")} />
          <label htmlFor="urgent-toggle">Urgent only</label>
        </div>
        <div className="settings-item checkbox-group">
          <input id="important-toggle" type="checkbox" checked={filters.is_important} onChange={() => handleToggle("is_important")} />
          <label htmlFor="important-toggle">Important only</label>
        </div>
      </div>

      <div className="settings-group">
        <button className="settings-item" onClick={handleTabBar}><Grid className="icon" /> Tab Bar</button>
      </div>

      <div className="settings-group">
        <div className="settings-item">
          <Brush className="icon" /> Dark Mode
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode((p) => !p)} />
            <span className="slider" />
          </label>
        </div>
        <div className="settings-item">
          <Brush className="icon" /> Theme
          <ThemePicker />
        </div>
        <button className="settings-item" onClick={handleSounds}><Music className="icon" /> Sounds & Notifications</button>
        <button className="settings-item" onClick={handleDateTime}><Clock className="icon" /> Date & Time</button>
        <button className="settings-item" onClick={handleWidgets}><LayoutGrid className="icon" /> Widgets</button>
        <button className="settings-item" onClick={handleGeneral}><Cog className="icon" /> General</button>
      </div>

      <div className="settings-group">
        <button className="settings-item" onClick={handleImport}><Share2 className="icon" /> Import & Integration</button>
      </div>

      <div className="settings-group">
        <button className="settings-item" onClick={handleHelp}><MessageSquare className="icon" /> Help & Feedback</button>
        <button className="settings-item" onClick={handleFollow}><User className="icon" /> Follow Us</button>
        <button className="settings-item" onClick={handleAbout}><Info className="icon" /> About <span className="version">v7.5.41</span></button>
      </div>

      <button className="btn-signout" onClick={signOut}>Sign Out</button>
    </div>
  );
}
