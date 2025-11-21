import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { isAuthenticated } from '../../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();
   const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const features = [
    {
      icon: "🌍",
      title: "Multi-Language Support",
      description: "Enjoy music in 7+ languages including English, Hindi, Punjabi"
    },
    {
      icon: "🎵",
      title: "Smart Recommendations",
      description: "Get personalized music that matches your emotional state"
    },
    {
      icon: "😊",
      title: "Emotion Detection",
      description: "AI-powered facial recognition detects your mood in real-time"
    },
    {
      icon: "📊",
      title: "Mood Analytics",
      description: "Track your emotional patterns and listening habits over time"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-background">
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="shape"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      

      {/* Navigation - UPDATE THIS SECTION */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo-section">
            <span className="logo-icon">🎵</span>
            <h1 className="logo-text">EmoTune</h1>
          </div>
          <div className="nav-buttons">
            {isLoggedIn ? (
              <>
                <button className="btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
                <button className="btn-primary" onClick={() => navigate('/app')}>
                  Go to App
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
          <div className="hero-badge">
            <span className="badge-emoji">✨</span>
            <span>AI-Powered Music Experience</span>
          </div>
          
          <h1 className="hero-title">
            Music That Feels
            <span className="gradient-text"> Your Emotions</span>
          </h1>
          
          <p className="hero-description">
            Experience the future of music streaming with emotion-based recommendations.
            Our AI analyzes your mood and curates the perfect playlist for every moment.
          </p>

          <div className="hero-buttons">
            <button 
              className="btn-large btn-primary" 
              onClick={() => navigate(isLoggedIn ? '/app' : '/register')}
            >
              <span>{isLoggedIn ? 'Go to App' : 'Start Your Journey'}</span>
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-large btn-outline" onClick={() => setShowDemoModal(true)}>
              <span>Watch Demo</span>
              <span className="btn-icon">▶</span>
            </button>
          </div>

          {/* Emotion Icons Animation */}
          <div className="emotion-showcase">
            {['😊', '😢', '😠', '😐', '😲', '😨', '🤢'].map((emoji, index) => (
              <div
                key={index}
                className="emotion-bubble"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  left: `${2 + index * 12}%`
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* 3D Card Showcase */}
        <div className="hero-visual">
          <div className="card-3d">
            <div className="card-face card-front">
              <div className="music-player-demo">
                <div className="player-header">
                  <div className="album-art">
                    <div className="album-gradient"></div>
                    <span className="play-icon">▶</span>
                  </div>
                  <div className="track-info">
                    <h4>Perfect Vibes</h4>
                    <p>Based on your mood</p>
                  </div>
                </div>
                <div className="player-controls">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <div className="control-buttons">
                    <button>⏮</button>
                    <button className="play-btn">⏸</button>
                    <button>⏭</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Powerful Features
            <span className="title-underline"></span>
          </h2>
          <p className="section-subtitle">
            Everything you need for an emotional musical journey
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${currentFeature === index ? 'active' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-glow"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '7+', label: 'Languages' },
            { number: '98%', label: 'Accuracy' },
            { number: '1M+', label: 'Songs' }
          ].map((stat, index) => (
            <div key={index} className="stat-card">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW: Additional Features - YEH ADD KARO */}
<section className="additional-features">
  <div className="features-grid-simple">
    <div className="feature-card-simple">
      <div className="feature-icon-large">🧠</div>
      <h3 className="feature-title">Deep Learning Models</h3>
      <p className="feature-description">
        Advanced TensorFlow-based CNN architecture analyzes facial micro-expressions 
        with 94.2% accuracy, trained on diverse datasets
      </p>
    </div>

    <div className="feature-card-simple">
      <div className="feature-icon-large">⚡</div>
      <h3 className="feature-title">Real-Time Processing</h3>
      <p className="feature-description">
        Lightning-fast emotion detection with OpenCV optimization delivers instant 
        results at 30+ FPS
      </p>
    </div>

    <div className="feature-card-simple">
      <div className="feature-icon-large">🎯</div>
      <h3 className="feature-title">Smart Music Mapping</h3>
      <p className="feature-description">
        Intelligent emotion-to-music algorithms consider user preferences and 
        listening history
      </p>
    </div>

    <div className="feature-card-simple">
      <div className="feature-icon-large">🔒</div>
      <h3 className="feature-title">Privacy Protected</h3>
      <p className="feature-description">
        All processing happens locally - no facial data transmitted or stored 
        on servers
      </p>
    </div>
  </div>
</section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          {[
            { step: '1', title: 'Capture Your Mood', desc: 'Upload a photo or use your camera' },
            { step: '2', title: 'AI Analysis', desc: 'Our AI detects your emotions' },
            { step: '3', title: 'Get Recommendations', desc: 'Enjoy perfectly matched music' }
          ].map((item, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {index < 2 && <div className="step-connector">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Music Experience?</h2>
          <p className="cta-description">
            Join thousands of users who have discovered music that truly understands them
          </p>
          <button className="btn-cta" onClick={() => navigate('/register')}>
            Start Free Today
            <span className="cta-sparkle">✨</span>
          </button>
        </div>
      </section>

      
{showDemoModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(2, 9, 27, 0.9)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <div style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
      <button
        onClick={() => setShowDemoModal(false)}
        style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '2rem',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>
      
      {/* Lottie animation ya video yaha */}
      <div style={{
        background: 'rgba(173, 157, 248, 0.95)',
        borderRadius: '20px',
        padding: '60px',
        textAlign: 'center'
      }}>
        
        
        <h3 style={{ fontSize: '2rem', marginBottom: '20px' }}>Interactive Demo Coming Soon!</h3>
        <p style={{ opacity: 0.8, marginBottom: '30px' }}>
          Experience how EmoTune detects your emotions and recommends perfect music
        </p>
        
        {/* Demo steps preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '40px' }}>
          <div style={{ padding: '20px', background: 'rgba(19, 81, 112, 0.33)', borderRadius: '15px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📸</div>
            <h4>Step 1: Capture Face</h4>
          </div>
          <div style={{ padding: '20px', background: 'rgba(186, 104, 200, 0.71)', borderRadius: '15px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤖</div>
            <h4>Step 2: AI Analysis</h4>
          </div>
          <div style={{ padding: '20px', background: 'rgba(159, 19, 19, 0.41)', borderRadius: '15px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎵</div>
            <h4>Step 3: Get Music</h4>
          </div>
          <div style={{ padding: '20px', background: 'rgba(77, 208, 225, 0.59)', borderRadius: '15px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
            <h4>Step 4: Track Mood</h4>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>🎵 EmoTune</h3>
            <p>Music that understands you</p>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Features</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 EmoTune. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;