// src/components/SettingsPage.js

import React, { useState, useEffect, useContext } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import {
  Crown, Grid, Brush, Music, Settings as Cog,
  Share2, MessageSquare, User, Info, LogOut, ArrowRight, Volume2, Globe2, Mic
} from "lucide-react";
import { PremiumContext } from "../context/PremiumContext";
import { toast } from 'react-toastify';
import "./SettingsPage.css";

export default function SettingsPage({
  isDarkMode, setIsDarkMode,
  onBack,
  userName, setUserName,
  userAvatar, setUserAvatar,
  // Props for voice settings from App.js
  voiceSettings, 
  setVoiceSettings,
  availableVoices
}) {
  const { isPremium, upgradeToPremium } = useContext(PremiumContext);
  const [cookies, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const navigate = useNavigate();

  // State for data fetched within this component
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchGamificationData = async () => {
      if (!cookies.AuthToken) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/gamification/status?userEmail=${cookies.Email}`, {
          headers: { Authorization: `Bearer ${cookies.AuthToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch gamification status');
        const data = await res.json();
        if (data) {
          setLevel(data.level || 1);
          setBadges(data.badges || []);
        }
      } catch (err) {
        console.error("Failed to fetch gamification status:", err);
      }
    };
    fetchGamificationData();
  }, [cookies.AuthToken, cookies.Email]);

  const handleNameBlur = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/users/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.AuthToken}`,
        },
        body: JSON.stringify({ name: userName }),
      });
      if (!res.ok) throw new Error("Failed to save name");
      document.cookie = `UserName=${encodeURIComponent(userName)}; path=/`;
      toast.success("Profile name updated!");
    } catch (err) {
      console.error("❌ Name update error:", err);
      toast.error("Could not update profile name.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/users/profile`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.AuthToken}`,
          },
          body: JSON.stringify({ avatar: dataUrl }),
        });
        if (!res.ok) throw new Error("Failed to save avatar");
        setUserAvatar(dataUrl);
        document.cookie = `UserAvatar=${encodeURIComponent(dataUrl)}; path=/`;
        toast.success("Avatar updated!");
      } catch (err) {
        console.error("❌ Avatar update error:", err);
        toast.error("Could not update avatar.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceSettingChange = (e) => {
    const { name, value } = e.target;
    setVoiceSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleVoiceToggle = (key) => {
    setVoiceSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const go = (p) => navigate(p);

  const signOut = () => {
    ["Email", "AuthToken", "UserName", "UserAvatar"].forEach((c) => removeCookie(c, { path: "/" }));
    navigate("/login");
  };
  
  const uniqueLanguages = [...new Set(availableVoices.map(v => v.lang))];

  return (
    <div className="settings-page">
      <button className="btn btn-outline back-button" onClick={onBack}>&larr; Back to Tasks</button>

      {/* --- Profile Section --- */}
      <div className="settings-group profile-card">
        <div className="avatar-container">
          <img src={userAvatar || "/default-avatar.png"} alt="avatar" className="settings-avatar" />
          <label htmlFor="avatarUpload" className="upload-overlay">✎</label>
          <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="avatar-input" />
        </div>
        <div className="user-details">
          <input
            className="profile-name-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Enter your name"
          />
          <div className="gamification-details">
            <span className="badge level">Lv.{level}</span>
            <span className="badge">{badges.length} Badges</span>
          </div>
        </div>
      </div>

      {/* --- Upgrade Banner --- */}
      {!isPremium && (
        <div className="settings-group upgrade-banner">
          <Crown className="icon" />
          <div className="upgrade-text">
            <strong>Upgrade to Premium</strong>
            <small>Calendar view and more functions</small>
          </div>
          <button className="btn btn-primary" onClick={upgradeToPremium}>Upgrade</button>
        </div>
      )}

      {/* --- Main Settings --- */}
      <div className="settings-group">
        <h3 className="settings-group-title">General Settings</h3>
        <div className="settings-item">
          <Brush className="icon" /> Dark Mode
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode((p) => !p)} />
            <span className="slider" />
          </label>
        </div>
        <div className="settings-item">
          <Volume2 className="icon" /> Voice Reminders
          <label className="switch">
            <input type="checkbox" checked={voiceSettings.remindersEnabled} onChange={() => handleVoiceToggle('remindersEnabled')} />
            <span className="slider" />
          </label>
        </div>
        <div className="settings-item">
          <Globe2 className="icon" /> Voice Language
          <select name="language" value={voiceSettings.language} onChange={handleVoiceSettingChange}>
            {uniqueLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
        <div className="settings-item">
          <Mic className="icon" /> Voice Gender
          <select name="gender" value={voiceSettings.gender} onChange={handleVoiceSettingChange}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>
        <button className="settings-item" onClick={() => go("/settings/general")}> <Cog className="icon" /> General <ArrowRight size={16} className="arrow-right" /> </button>
        <button className="settings-item" onClick={() => go("/settings/notifications")}> <Music className="icon" /> Sounds & Notifications <ArrowRight size={16} className="arrow-right" /> </button>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">App & Data</h3>
        <button className="settings-item" onClick={() => go("/settings/tab-bar")}> <Grid className="icon" /> Tab Bar <ArrowRight size={16} className="arrow-right" /> </button>
        <button className="settings-item" onClick={() => go("/settings/integration")}> <Share2 className="icon" /> Import & Integration <ArrowRight size={16} className="arrow-right" /> </button>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">About</h3>
        <button className="settings-item" onClick={() => go("/help")}> <MessageSquare className="icon" /> Help & Feedback <ArrowRight size={16} className="arrow-right" /> </button>
        <button className="settings-item" onClick={() => window.open("https://twitter.com", "_blank")}> <User className="icon" /> Follow Us </button>
        <button className="settings-item" onClick={() => go("/about")}> <Info className="icon" /> About <span className="version">v1.0.0</span> </button>
      </div>

      <button className="btn btn-danger sign-out-button" onClick={signOut}> <LogOut className="icon" /> Sign Out </button>
    </div>
  );
}