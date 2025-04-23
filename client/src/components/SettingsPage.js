import React, { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Grid,
  Brush,
  Music,
  Clock,
  LayoutGrid,
  Settings as Cog,
  Share2,
  MessageSquare,
  User,
  Info
} from "lucide-react";
import "./SettingsPage.css";

// the address users will forward mail to
const inboundEmailAddress = process.env.REACT_APP_INBOUND_EMAIL;

/**
 * Settings main page.  Each “section” button now routes to its own URL instead of just alerting.
 * We rely on react‑router and lazy‑loaded sub‑pages, so the navigation will succeed even if the
 * feature pages have not been implemented yet – you can scaffold them with <Outlet /> whenever
 * you are ready.
 */
const SettingsPage = ({ filters, setFilters, listOptions }) => {
  /* ---------------------------------------------------------------------- */
  /* hooks & helpers                                                        */
  /* ---------------------------------------------------------------------- */
  const [cookies, , removeCookie] = useCookies([
    "Email",
    "AuthToken",
    "UserName",
    "UserAvatar"
  ]);
  const navigate = useNavigate();

  // Profile state ---------------------------------------------------------
  const [profileName, setProfileName] = useState(cookies.UserName || "");
  const [avatarUrl, setAvatarUrl] = useState(
    cookies.UserAvatar || "/default-avatar.png"
  );
  const [level] = useState(6);
  const [badges] = useState(8);

  // Calendar Sync state ---------------------------------------------------
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");

  /* ---------------------------------------------------------------------- */
  /* effects                                                                */
  /* ---------------------------------------------------------------------- */
  // On mount, fetch connection status from backend
  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVER_URL}/auth/calendar/status`, {
      headers: { Authorization: `Bearer ${cookies.AuthToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setCalendarConnected(data.connected);
        setCalendarEmail(data.email || "");
      })
      .catch(() => {
        // network error – keep defaults, silently fail
      });
  }, [cookies.AuthToken]);

  /* ---------------------------------------------------------------------- */
  /* profile handlers                                                       */
  /* ---------------------------------------------------------------------- */
  const signOut = () => {
    ["Email", "AuthToken", "UserName", "UserAvatar"].forEach((c) =>
      removeCookie(c, { path: "/" })
    );
    navigate("/login");
  };

  const handleNameBlur = () => {
    document.cookie = `UserName=${encodeURIComponent(profileName)};path=/`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      document.cookie = `UserAvatar=${encodeURIComponent(dataUrl)};path=/`;
    };
    reader.readAsDataURL(file);
  };

  /* ---------------------------------------------------------------------- */
  /* calendar handlers                                                      */
  /* ---------------------------------------------------------------------- */
  const handleConnectCalendar = () =>
    (window.location.href = `${process.env.REACT_APP_SERVER_URL}/auth/calendar/google`);

  const handleDisconnectCalendar = () => {
    fetch(`${process.env.REACT_APP_SERVER_URL}/auth/calendar/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cookies.AuthToken}` }
    }).then((res) => {
      if (res.ok) {
        setCalendarConnected(false);
        setCalendarEmail("");
      }
    });
  };

  /* ---------------------------------------------------------------------- */
  /* filter handlers                                                        */
  /* ---------------------------------------------------------------------- */
  const handleListChange = (e) => setFilters((f) => ({ ...f, list_name: e.target.value }));
  const handleStatusChange = (e) => setFilters((f) => ({ ...f, status: e.target.value }));
  const handleToggle = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  /* ---------------------------------------------------------------------- */
  /* navigation helpers                                                     */
  /* ---------------------------------------------------------------------- */
  const go = (path) => navigate(path);

  /* ---------------------------------------------------------------------- */
  /* section handlers (now real)                                            */
  /* ---------------------------------------------------------------------- */
  const handleUpgrade = () => go("/upgrade");
  const handleTabBar = () => go("/settings/tab-bar");
  const handleAppearance = () => go("/settings/appearance");
  const handleSounds = () => go("/settings/notifications");
  const handleDateTime = () => go("/settings/date-time");
  const handleWidgets = () => go("/settings/widgets");
  const handleGeneral = () => go("/settings/general");
  const handleImport = () => go("/settings/integration");
  const handleHelp = () => go("/help");
  const handleFollow = () => window.open("https://twitter.com/yourhandle", "_blank", "noopener,noreferrer");
  const handleAbout = () => go("/about");

  /* ---------------------------------------------------------------------- */
  /* render                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="settings-page">
      {/* Profile Header --------------------------------------------------- */}
      <div className="settings-profile">
        <div className="avatar-container">
          <img src={avatarUrl} alt="Avatar" className="settings-avatar" />
          <label htmlFor="avatarUpload" className="upload-overlay">
            ✎
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="avatar-input"
          />
        </div>
        <div className="settings-userinfo">
          <input
            type="text"
            className="profile-name-input"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Enter your name"
          />
          <div className="settings-badges">
            <button className="badge level" onClick={() => alert(`You are at level ${level}!`)}>
              Lv.{level}
            </button>
            <button className="badge" onClick={() => alert(`You have ${badges} badges!`)}>
              {badges} Badges
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Banner --------------------------------------------------- */}
      <div className="settings-upgrade">
        <Crown className="icon" />
        <div className="upgrade-text">
          <strong>Upgrade to Premium</strong>
          <small>Calendar view and more functions</small>
        </div>
        <button className="btn-upgrade" onClick={handleUpgrade}>
          Upgrade
        </button>
      </div>

      {/* Email‑to‑task -------------------------------------------------- */}
      <div className="settings-group">
        <h3 className="settings-group-title">Email to Task</h3>
        <p>Forward any email to:</p>
        <code>{inboundEmailAddress}</code>
        <small>and it will appear as a new to‑do.</small>
      </div>

      {/* Calendar Sync ---------------------------------------------------- */}
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

      {/* Filters ---------------------------------------------------------- */}
      <div className="settings-group">
        <h3 className="settings-group-title">Filters</h3>
        <div className="settings-item">
          <label>List:</label>
          <select value={filters.list_name} onChange={handleListChange}>
            {listOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-item">
          <label>Status:</label>
          <select value={filters.status} onChange={handleStatusChange}>
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="settings-item checkbox-group">
          <input
            id="urgent-toggle"
            type="checkbox"
            checked={filters.is_urgent}
            onChange={() => handleToggle("is_urgent")}
          />
          <label htmlFor="urgent-toggle">Urgent only</label>
        </div>
        <div className="settings-item checkbox-group">
          <input
            id="important-toggle"
            type="checkbox"
            checked={filters.is_important}
            onChange={() => handleToggle("is_important")}
          />
          <label htmlFor="important-toggle">Important only</label>
        </div>
      </div>

      {/* Other Sections --------------------------------------------------- */}
      <div className="settings-group">
        <button className="settings-item" onClick={handleTabBar}>
          <Grid className="icon" /> Tab Bar
        </button>
      </div>
      <div className="settings-group">
        <button className="settings-item" onClick={handleAppearance}>
          <Brush className="icon" /> Appearance
        </button>
        <button className="settings-item" onClick={handleSounds}>
          <Music className="icon" /> Sounds & Notifications
        </button>
        <button className="settings-item" onClick={handleDateTime}>
          <Clock className="icon" /> Date & Time
        </button>
        <button className="settings-item" onClick={handleWidgets}>
          <LayoutGrid className="icon" /> Widgets
        </button>
        <button className="settings-item" onClick={handleGeneral}>
          <Cog className="icon" /> General
        </button>
      </div>
      <div className="settings-group">
        <button className="settings-item" onClick={handleImport}>
          <Share2 className="icon" /> Import & Integration
        </button>
      </div>
      <div className="settings-group">
        <button className="settings-item" onClick={handleHelp}>
          <MessageSquare className="icon" /> Help & Feedback
        </button>
        <button className="settings-item" onClick={handleFollow}>
          <User className="icon" /> Follow Us
        </button>
        <button className="settings-item" onClick={handleAbout}>
          <Info className="icon" /> About <span className="version">v7.5.41</span>
        </button>
      </div>

      {/* Sign Out ---------------------------------------------------------- */}
      <button className="btn-signout" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
};

export default SettingsPage;
