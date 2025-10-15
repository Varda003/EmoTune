import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, musicAPI, getUser, logout } from '../../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [likedSongs, setLikedSongs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    preferred_genres: user?.preferred_genres || ''
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLikedSongs();
  }, []);

  const fetchLikedSongs = async () => {
    try {
      const response = await musicAPI.getLikedSongs();
      if (response.success) {
        setLikedSongs(response.liked_songs);
      }
    } catch (err) {
      console.error('Error fetching liked songs:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(formData);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        setEditing(false);
        alert('✅ Profile updated successfully!');
      }
    } catch (err) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete your account? This action cannot be undone!'
    );
    
    if (confirmed) {
      try {
        await userAPI.deleteAccount();
        alert('Account deleted successfully');
        logout();
      } catch (err) {
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const handleUnlikeSong = async (songId) => {
    try {
      await musicAPI.unlikeSong(songId);
      setLikedSongs(likedSongs.filter(song => song.id !== songId));
      alert('❤️ Song removed from liked songs');
    } catch (err) {
      alert('Failed to unlike song');
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

      {/* Header */}
      <div className="header">
        <div className="header-logo">EmoTune</div>
        <div className="header-nav">
          <button
            onClick={() => navigate('/app')}
            style={{
              padding: '10px 20px',
              background: 'var(--primary-gradient)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              marginRight: '15px'
            }}
          >
            ← Back to App
          </button>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              background: 'var(--warning-gradient)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <h2 style={{
            fontSize: '2.5rem',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            My Profile
          </h2>
        </div>

        <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Profile Header */}
          <div style={{ 
            textAlign: 'center', 
            padding: '30px',
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: '30px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'var(--primary-gradient)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              margin: '0 auto 20px',
              border: '4px solid var(--glass-border)'
            }}>
              👤
            </div>
            
            {editing ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="preferred_genres"
                    className="form-input"
                    value={formData.preferred_genres}
                    onChange={handleChange}
                    placeholder="Preferred genres (comma-separated)"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveProfile}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: 'auto', flex: 1 }}
                  >
                    {loading ? 'Saving...' : '✅ Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="btn"
                    style={{ 
                      width: 'auto', 
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '2rem', marginBottom: '10px' }}>
                  {user?.name}
                </h3>
                <p style={{ opacity: 0.8, marginBottom: '15px' }}>
                  {user?.email}
                </p>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '10px 25px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Edit Profile
                </button>
              </>
            )}
          </div>

          {/* Account Info */}
          <div style={{ 
            padding: '25px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            marginBottom: '30px'
          }}>
            <h4 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>
              📋 Account Information
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <p style={{ opacity: 0.7, marginBottom: '5px' }}>Account Created</p>
                <p style={{ fontWeight: '600' }}>
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p style={{ opacity: 0.7, marginBottom: '5px' }}>Preferred Genres</p>
                <p style={{ fontWeight: '600' }}>
                  {user?.preferred_genres || 'Not set'}
                </p>
              </div>
              <div>
                <p style={{ opacity: 0.7, marginBottom: '5px' }}>Liked Songs</p>
                <p style={{ fontWeight: '600' }}>
                  {likedSongs.length} songs
                </p>
              </div>
            </div>
          </div>

          {/* Liked Songs */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ 
              marginBottom: '20px', 
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ❤️ Liked Songs
            </h4>
            
            {likedSongs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                opacity: 0.7
              }}>
                <p style={{ fontSize: '3rem', marginBottom: '15px' }}>🎵</p>
                <p>No liked songs yet. Start detecting emotions and like some music!</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '15px'
              }}>
                {likedSongs.map((song) => (
                  <div
                    key={song.id}
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h5 style={{ marginBottom: '5px', fontSize: '1.1rem' }}>
                        {song.song_title}
                      </h5>
                      <p style={{ opacity: 0.7, marginBottom: '5px' }}>
                        {song.artist}
                      </p>
                      {song.emotion_detected && (
                        <span style={{
                          fontSize: '0.8rem',
                          padding: '4px 12px',
                          background: 'var(--accent-gradient)',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          Mood: {song.emotion_detected}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnlikeSong(song.id)}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--warning-gradient)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      💔 Unlike
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div style={{
            padding: '25px',
            background: 'rgba(255, 107, 149, 0.1)',
            border: '1px solid rgba(255, 107, 149, 0.3)',
            borderRadius: '15px'
          }}>
            <h4 style={{ 
              marginBottom: '15px', 
              fontSize: '1.3rem',
              color: '#ff6b95'
            }}>
              ⚠️ Danger Zone
            </h4>
            <p style={{ opacity: 0.8, marginBottom: '20px' }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              style={{
                padding: '12px 25px',
                background: 'var(--secondary-gradient)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;