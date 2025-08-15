// src/components/MobileHeader.js
import React, { useState } from 'react';
import { Menu, X, Share2, User, Settings, LogOut } from 'lucide-react';
import './MobileHeader.css';

export default function MobileHeader({
  listName,
  onSignOut,
  onSettingsClick,
  onShareClick,
  onTitleClick
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSettings = () => {
    onSettingsClick();
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    onShareClick();
    setIsMenuOpen(false);
  };

  const handleProfile = () => {
    alert('Navigate to Profile');
    setIsMenuOpen(false);
  }

  return (
    <>
      {/* UPDATE: Added .page-header for consistent header styling */}
      <header className="mobile-header page-header">
        <div className="header-title">
          <span className="sparkle">✧˚</span>
          <h1
            onClick={onTitleClick}
            style={{ cursor: 'pointer' }}
            title="Go back to Tasks"
          >
            {listName.includes("TaskMaster") ? "TaskMaster" : listName}
          </h1>
        </div>
        {/* UPDATE: Added .btn for base styling on the menu icon */}
        <button className="btn menu-button" onClick={() => setIsMenuOpen(true)}>
          <Menu size={28} />
        </button>
      </header>

      <div
        className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-header">
            <h2>Menu</h2>
            {/* UPDATE: Added .btn for base styling on the close icon */}
            <button className="btn close-menu-button" onClick={() => setIsMenuOpen(false)}>
              <X size={28} />
            </button>
          </div>
          <nav className="menu-nav">
            {/* UPDATE: Applied consistent .btn classes to all menu items */}
            <button className="btn btn-outline" onClick={handleProfile}>
              <User className="icon" /> Profile
            </button>
            <button className="btn btn-outline" onClick={handleSettings}>
              <Settings className="icon" /> Settings
            </button>
            <button className="btn btn-outline" onClick={handleShare}>
              <Share2 className="icon" /> Share
            </button>
            <button onClick={onSignOut} className="btn btn-danger">
              <LogOut className="icon" /> Sign Out
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}