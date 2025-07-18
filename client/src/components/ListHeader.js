// src/components/ListHeader.js

import React, { useState } from "react";
import { useCookies } from "react-cookie";
import { Settings as Cog, Menu, X, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./ListHeader.css";

export default function ListHeader({
  listName,
  toggleDashboard,
  onSettingsClick,
  onShareClick,
  onSignOut
}) {
  const [, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleSignOut = () => {
    removeCookie("Email", { path: "/" });
    removeCookie("AuthToken", { path: "/" });
    if (onSignOut) onSignOut();
    else window.location.reload();
  };

  return (
    <header className="list-header" role="banner">
      <h1>{listName}</h1>

      {/* Hamburger toggle for mobile */}
      <button
        className="hamburger-btn"
        aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen(o => !o)}
      >
        {navOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Nav buttons */}
      <nav className={`nav-buttons${navOpen ? " open" : ""}`} role="navigation">
        <button className="btn share" onClick={onShareClick} aria-label="Share this list">
          <Share2 size={16} style={{ marginRight: 4 }} />
          Share
        </button>
        <button className="btn dashboard" onClick={toggleDashboard} aria-label="Toggle dashboard">
          Dashboard
        </button>
        <button className="btn profile" onClick={() => navigate("/profile")} aria-label="Go to profile">
          Profile
        </button>
        <button className="btn settings" onClick={onSettingsClick} aria-label="Open settings">
          <Cog size={16} style={{ marginRight: 4 }} />
          Settings
        </button>
        <button className="btn signout" onClick={handleSignOut} aria-label="Sign out">
          Sign Out
        </button>
      </nav>
    </header>
  );
}
