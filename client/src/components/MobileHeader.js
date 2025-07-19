// src/components/MobileHeader.js
import React, { useState } from 'react';
import { Menu, X, Share2, User, Settings, LogOut } from 'lucide-react';
import './MobileHeader.css';

export default function MobileHeader({ listName, onSignOut }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // In a real app, these would navigate to the correct pages
  const handleProfile = () => alert('Navigate to Profile');
  const handleSettings = () => alert('Navigate to Settings');
  const handleShare = () => alert('Open Share Modal');

  return (
    <>
      <header className="mobile-header">
        <div className="header-title">
          <span className="sparkle">✧˚</span>
          <h1>{listName.includes("TaskMaster") ? "TaskMaster" : listName}</h1>
          <span className="sparkle">˚✧</span>
        </div>
        <button className="menu-button" onClick={() => setIsMenuOpen(true)}>
          <Menu size={28} />
        </button>
      </header>

      {/* This is the slide-out menu */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="menu-header">
            <h2>Menu</h2>
            <button className="close-menu-button" onClick={() => setIsMenuOpen(false)}>
              <X size={28} />
            </button>
          </div>
          <nav className="menu-nav">
            <button onClick={handleProfile}><User className="icon" /> Profile</button>
            <button onClick={handleSettings}><Settings className="icon" /> Settings</button>
            <button onClick={handleShare}><Share2 className="icon" /> Share</button>
            <button onClick={onSignOut} className="signout-button"><LogOut className="icon" /> Sign Out</button>
          </nav>
        </div>
      </div>
    </>
  );
}
