// src/components/ForgotPassword.js
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError]     = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send email')
      setMessage('🔗 A reset link has been sent to your email.')
      setError(null)
      // optionally navigate after a delay
    } catch (err) {
      setError(err.message)
      setMessage(null)
    }
  }

  return (
    <div className="auth-container">
      <div className="login-box">
        <h2>Reset your password</h2>
        {message && <p className="success">{message}</p>}
        {error   && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Your email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn login-btn">
            Send reset link
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => navigate('/')}
        >
          ← Back to login
        </button>
      </div>
    </div>
  )
}
