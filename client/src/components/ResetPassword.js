// src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirm) {
      setError("Passwords don't match");
      return;
    }

    try {
      // FIX: The URL path is now correct.
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // FIX: The server expects a field named 'password'.
          body: JSON.stringify({ token, password: newPassword }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        // This handles errors from the server (like 400, 404, 500 etc.)
        throw new Error(data.detail || 'Failed to reset password.');
      }

      setMessage('Your password has been reset! Redirecting to login…');
      // FIX: Redirect to the login page for clarity.
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      // This catches network errors or the error thrown above.
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Missing reset token. Please request a new link.');
    }
  }, [token]);

  return (
    <div className="auth-container">
      <div className="login-box">
        <h2>Choose a new password</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              placeholder="New password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn login-btn" disabled={!token}>
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}