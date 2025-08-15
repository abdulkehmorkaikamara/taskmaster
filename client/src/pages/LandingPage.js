// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Zap, Users, BarChart2 } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* --- Navigation Bar --- */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="4" fill="#3b82f6"/>
              <path d="M7 13.5L10 16.5L17 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 5.5L19 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M21 7.5L20 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>TaskMaster</span>
          </Link>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
          </ul>
          <div className="auth-actions">
            <Link to="/login" className="btn-nav-outline">Sign In</Link>
            <Link to="/signup" className="btn-nav-primary">Sign Up for Free</Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-headline">Finally, a task manager that works for you.</h1>
          <p className="hero-subheadline">
            Stop juggling apps. TaskMaster brings your notes, tasks, and team collaboration into one focused, beautiful space.
          </p>
          <Link to="/signup" className="btn-cta">
            Get Started – It’s Free <span className="arrow">→</span>
          </Link>
        </div>
        <div className="hero-image-container">
          <img
            src="https://placehold.co/900x500/dbeafe/3b82f6?text=TaskMaster+App&font=inter"
            alt="TaskMaster app interface"
            className="hero-image"
            onError={e => e.target.style.display = 'none'}
          />
        </div>
      </main>

      {/* --- Features Section --- */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Everything you need, nothing you don’t.</h2>
          <p className="section-subtitle">Focus on your work, not on managing your tools.</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><CheckCircle size={32} /></div>
              <h3>Simple & Powerful</h3>
              <p>A beautiful, intuitive interface that's easy to learn but powerful enough for any project.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Zap size={32} /></div>
              <h3>Blazingly Fast</h3>
              <p>Built for speed. No lag, no waiting. Just you and your tasks, in perfect sync.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Users size={32} /></div>
              <h3>Team Ready</h3>
              <p>Share lists, assign tasks, and collaborate with your team in real-time, effortlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><BarChart2 size={32} /></div>
              <h3>Insightful Analytics</h3>
              <p>Track your progress, understand your habits, and celebrate your achievements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="pricing" className="cta-section">
        <div className="section-container">
          <h2 className="section-title">Simple, transparent pricing.</h2>
          <p className="section-subtitle">Choose the plan that's right for you. Free forever for individuals.</p>
          <Link to="/signup" className="btn-cta">View Pricing</Link>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section id="testimonials" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Loved by teams everywhere.</h2>
          <p className="section-subtitle">See what our users have to say about TaskMaster.</p>
          {/* Add testimonial cards here */}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} TaskMaster. All rights reserved.</p>
      </footer>
    </div>
  );
}
