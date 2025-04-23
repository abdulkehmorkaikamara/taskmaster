import { useState } from "react";
import { useCookies } from "react-cookie";

const Auth = () => {
  const [, setCookie] = useCookies(null); 
  const [isLogIn, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const viewLogin = (status) => {
    setError(null);
    setIsLogin(status);
  };

  const handleSubmit = async (e, endpoint) => {
    e.preventDefault();

    if (!isLogIn && password !== confirmPassword) {
      setError("Make sure passwords match!");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.detail) {
        setError(data.detail);
      } else {
        setCookie("Email", data.email, { path: "/" });
        setCookie("AuthToken", data.token, { path: "/" });
        window.location.reload();
      }
    } catch (err) {
      setError("Something went wrong! Try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-container-box">
        <form 
          className={`auth-form ${isLogIn ? "slide-left" : "slide-right"}`} 
          onSubmit={(e) => handleSubmit(e, isLogIn ? "login" : "signup")}
        >
          <h2>{isLogIn ? "Please log in" : "Please sign up!"}</h2>

          <input 
            type="email" 
            placeholder="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />

          <div className="password-input">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <span onClick={() => setShowPassword((prev) => !prev)} className="toggle-eye">
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {!isLogIn && (
            <div className="password-input">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="confirm password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
              <span onClick={() => setShowConfirmPassword((prev) => !prev)} className="toggle-eye">
                {showConfirmPassword ? "🙈" : "👁️"}
              </span>
            </div>
          )}

          <button type="submit" className="create">Submit</button>

          {error && <div className={`error-message shake`}>{error}</div>}

          <div className="auth-options">
            <button 
              type="button" 
              onClick={() => viewLogin(false)} 
              className={!isLogIn ? "selected" : ""}
            >
              Sign Up
            </button>
            <button 
              type="button" 
              onClick={() => viewLogin(true)} 
              className={isLogIn ? "selected" : ""}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
