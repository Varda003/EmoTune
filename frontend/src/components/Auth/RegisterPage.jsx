import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferred_genres: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const genres = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 
    'Dance', 'Classical', 'Jazz', 'Country', 'Folk', 
    'World Music', 'Indie', 'Alternative', 'Metal'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenreToggle = (genre) => {
    const currentGenres = [...formData.preferred_genres];
    const index = currentGenres.indexOf(genre);
    
    if (index > -1) {
      currentGenres.splice(index, 1);
    } else {
      currentGenres.push(genre);
    }
    
    setFormData({
      ...formData,
      preferred_genres: currentGenres,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // Validation
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (formData.password.length < 8) {
    setError('Password must be at least 8 characters long');
    return;
  }

  if (formData.preferred_genres.length === 0) {
    setError('Please select at least one music genre');
    return;
  }

  setLoading(true);

  try {
    const response = await authAPI.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      preferred_genres: formData.preferred_genres.join(', '),
    });

    // if (response.success) {
    //   // FIX: Save token and user BEFORE navigating
    //   localStorage.setItem('access_token', response.access_token);
    //   localStorage.setItem('user', JSON.stringify(response.user));
      
    //   // Small delay to ensure storage completes
    //   setTimeout(() => {
    //     navigate('/app');
    //   }, 100);
    // }
    if (response.success) {
  // Clean the token before saving
  const cleanToken = response.access_token.trim();
  console.log('💾 Saving token, length:', cleanToken.length);
  console.log('💾 Token preview:', cleanToken.substring(0, 30));
  
  localStorage.setItem('access_token', cleanToken);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  // Verify it was saved
  const savedToken = localStorage.getItem('access_token');
  console.log('✅ Token saved successfully:', !!savedToken);
  console.log('✅ Saved token preview:', savedToken.substring(0, 30));
  
  // Navigate after verification
  setTimeout(() => {
    navigate('/app');
  }, 100);
}
  } catch (err) {
    setError(
      err.response?.data?.message || 
      'Registration failed. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="app-container">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 className="logo">EmoTune</h1>
          <p className="tagline">
            AI-Based Emotion-Aware Music Recommender System
          </p>
        </div>

        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '30px',
            background: 'var(--secondary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2rem'
          }}>
            Create Your Account
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-user"></i> Full Name
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-lock"></i> Password
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Create a secure password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-lock"></i> Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-music"></i> Favorite Music Genres (Select at least one)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
                marginTop: '10px'
              }}>
                {genres.map((genre) => (
                  <div
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    style={{
                      padding: '10px 15px',
                      background: formData.preferred_genres.includes(genre)
                        ? 'var(--primary-gradient)'
                        : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.9rem'
                    }}
                  >
                    {genre}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Create My Account
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-20">
            <p style={{ opacity: 0.8 }}>
              Already have an account?{' '}
              <button
                className="link-button"
                onClick={() => navigate('/login')}
                style={{ fontSize: '1rem' }}
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;