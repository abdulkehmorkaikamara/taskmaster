// src/components/Auth.js
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import ForgotPassword from "./ForgotPassword";

import "./Auth.css";

export default function Auth() {
  const [, setCookie] = useCookies(["Email", "AuthToken"]);
  const [isLogIn, setIsLogin]                 = useState(true);
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [error, setError]                     = useState(null);
  const [showForgot, setShowForgot]           = useState(false);

  const toggleMode = (mode) => {
    setError(null);
    setIsLogin(mode);
  };

  const handleForgotPassword = () => {
    setShowForgot(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogIn && password !== confirmPassword) {
      setError("Passwords must match!");
      return;
    }
    const endpoint = isLogIn ? "login" : "signup";
    try {
      const res  = await fetch(
        `${process.env.REACT_APP_SERVERURL}/${endpoint}`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (data.detail) {
        setError(data.detail);
      } else {
        setCookie("Email",     data.email, { path: "/" });
        setCookie("AuthToken", data.token, { path: "/" });
        window.location.reload();
      }
    } catch {
      setError("Network error — please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="login-box">
        <h2>{isLogIn ? "Please log in" : "Create an account"}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail className="icon" />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <Lock className="icon" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-eye"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {!isLogIn && (
            <div className="input-group">
              <Lock className="icon" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirm password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <div className="options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            {isLogIn && (
              <button
                type="button"
                className="forgot"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn login-btn">
            {isLogIn ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="auth-switch">
          {isLogIn ? (
            <p>
              Don’t have an account?{" "}
              <button type="button" onClick={() => toggleMode(false)}>
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button type="button" onClick={() => toggleMode(true)}>
                Log In
              </button>
            </p>
          )}
        </div>
      </div>

      {/** Render the ForgotPassword screen inline as a modal */}
      {showForgot && (
        <ForgotPassword onClose={() => setShowForgot(false)} />
      )}
    </div>
  );
}
