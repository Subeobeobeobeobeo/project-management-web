import React, { useState } from 'react';
import './LandingPage.css';
import Logo from '../assets/ariston-logo.svg';

const YT_EMBED = 'https://www.youtube.com/embed/l6EzZafb1Pk?autoplay=1&mute=1&controls=0&loop=1&playlist=l6EzZafb1Pk&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1';

export default function LandingPage({ onStart = () => {} }) {
  const [formValues, setFormValues] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formValues.name.trim();
    const email = formValues.email.trim();
    if (!name || !email) {
      setError('Please enter both name and email.');
      return;
    }
    setError('');
    onStart({ name, email });
  };

  return (
    <div className="landing-video-page">
      <div className="landing-video">
        <iframe
          src={YT_EMBED}
          title="Landing Background"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="video-overlay" />

      <div className="landing-content">
        <nav className="video-nav">
          <div className="nav-brand">
            <img src={Logo} alt="Ariston" className="nav-logo" />
          </div>
        </nav>

        <div className="hero-center">
          <div className="hero-card">
            <h1 className="hero-heading">WELCOME TO SALES MANAGEMENT WEBSITE</h1>
            <p className="hero-subcopy">The less effort, the faster and more powerful you will be.</p>

            <form className="hero-form" onSubmit={handleSubmit} id="signup">
              <input className="hero-input" name="name" value={formValues.name} onChange={handleChange} placeholder="Name" autoComplete="name" required />
              <input className="hero-input" name="email" value={formValues.email} onChange={handleChange} placeholder="Email" type="email" autoComplete="email" required />
              <button className="hero-submit" type="submit">Submit</button>
            </form>
            {error && <div className="hero-error">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
