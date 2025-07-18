// src/components/ResetPassword.js
import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './ResetPassword.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState(null)
  const [message, setMessage]         = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError("Passwords don't match")
      return
    }
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SERVERURL}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Reset failed')
      setMessage('✅ Your password has been reset! Redirecting to login…')
      setError(null)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.message)
      setMessage(null)
    }
  }

  useEffect(() => {
    if (!token) setError('Missing reset token.')
  }, [token])

  return (
    <div className="auth-container">
      <div className="login-box">
        <h2>Choose a new password</h2>
        {error   && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              placeholder="New password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn login-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  )
}
