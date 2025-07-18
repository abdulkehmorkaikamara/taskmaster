// src/components/ProfilePage.js
import React, { useState, useEffect, useContext } from "react";
import { useCookies } from "react-cookie";
import { PremiumContext } from "../context/PremiumContext";
import "./ProfilePage.css";

export default function ProfilePage() {
  // ── STATE ───────────────────────────────────────────────
  const [cookies, setCookie] = useCookies(["Email", "UserName"]);
  const [displayName, setDisplayName] = useState(cookies.UserName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { isPremium, upgradeToPremium } = useContext(PremiumContext);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── EFFECT: catch Stripe success bounce ────────────────
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("upgrade") === "success") {
      setMessage("🎉 Premium unlocked – thank you!");
    }
  }, []);

  // ── HANDLERS ────────────────────────────────────────────
  const handleNameUpdate = (e) => {
    e.preventDefault();
    setCookie("UserName", displayName, { path: "/" });
    setMessage("✔️ Display name updated.");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setMessage("🔒 Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.text();
        setMessage("❌ Password change failed: " + err);
      }
    } catch (err) {
      setMessage("❌ Error changing password.");
    }
  };

  const handleUpgradeClick = async () => {
    setMessage("");
    setLoading(true);
    try {
      await upgradeToPremium(); // redirects to Stripe Checkout
    } catch (err) {
      console.error(err);
      setMessage("❌ Upgrade failed. Please try again.");
      setLoading(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div className="profile-page">
      <h2>Profile</h2>

      {/* Display-name form */}
      <form onSubmit={handleNameUpdate} className="profile-form">
        <label>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <button type="submit" className="btn edit">
          Update Name
        </button>
      </form>

      {/* Change-password form */}
      <form onSubmit={handlePasswordChange} className="profile-form">
        <label>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" className="btn edit">
          Change Password
        </button>
      </form>

      {/* Premium upsell (hidden if already premium) */}
      {!isPremium && (
        <div className="upgrade-section">
          <h3>Premium Features</h3>
          <p>Unlock advanced analytics and custom themes.</p>
          <button
            onClick={handleUpgradeClick}
            className="btn create"
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Upgrade to Premium"}
          </button>
        </div>
      )}

      {/* Message banner */}
      {message && (
        <p
          className={
            "message " + (message.startsWith("✔️") || message.startsWith("🎉") ? "success" : "error")
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
