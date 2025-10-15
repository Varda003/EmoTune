import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emotionAPI, musicAPI, getUser, logout } from '../../services/api';
import WebcamCapture from './WebcamCapture';

const MainApp = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user] = useState(getUser());
  
  // ADD THIS - Check token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 MainApp mounted - Token exists:', !!token);
    if (!token) {
      console.log('❌ No token, redirecting to login');
     // navigate('/login');
    }
  }, [navigate]); // Empty dependency array - runs once on mount

  // ... rest of your states
  
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [language, setLanguage] = useState('english');
  const [error, setError] = useState('');
  const [loadingMusic, setLoadingMusic] = useState(false);

  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    neutral: '😐',
    surprised: '😲',
    fearful: '😰',
    disgusted: '🤢',
    fear: '😰',
    disgust: '🤢',
    surprise: '😲'
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleDetectEmotion = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setDetecting(true);
    setError('');

    try {
      const response = await emotionAPI.detectFromUpload(selectedImage);

      if (response.success) {
        setDetectedEmotion({
          emotion: response.emotion,
          confidence: response.confidence,
          emoji: response.emoji || emotionEmojis[response.emotion.toLowerCase()]
        });

        // Fetch music recommendations
        fetchMusicRecommendations(response.emotion);
      } else {
        setError(response.message || 'Failed to detect emotion');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to detect emotion. Please try again.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const fetchMusicRecommendations = async (emotion) => {
    setLoadingMusic(true);
    try {
      const response = await musicAPI.getRecommendations(emotion.toLowerCase(), language, 6);
      
      if (response.success && response.tracks) {
        setRecommendations(response.tracks);
      } else {
        // Use dummy data if Spotify fails
        setRecommendations(getDummyRecommendations(emotion));
      }
    } catch (err) {
      console.error('Music API error:', err);
      // Fallback to dummy data
      setRecommendations(getDummyRecommendations(emotion));
    } finally {
      setLoadingMusic(false);
    }
  };

  const getDummyRecommendations = (emotion) => {
    const dummyData = {
      happy: [
        { title: 'Happy', artist: 'Pharrell Williams', album: 'G I R L' },
        { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' },
        { title: 'Uptown Funk', artist: 'Bruno Mars', album: '24K Magic' },
        { title: 'Shake It Off', artist: 'Taylor Swift', album: '1989' },
        { title: 'Walking on Sunshine', artist: 'Katrina & The Waves', album: 'Walking on Sunshine' },
        { title: "Don't Stop Me Now", artist: 'Queen', album: 'Jazz' }
      ],
      sad: [
        { title: 'Someone Like You', artist: 'Adele', album: '21' },
        { title: 'Hurt', artist: 'Johnny Cash', album: 'American IV' },
        { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', album: 'Sounds of Silence' },
        { title: 'Mad World', artist: 'Gary Jules', album: 'Trading Snakeoil for Wolftickets' },
        { title: 'Tears in Heaven', artist: 'Eric Clapton', album: 'Unplugged' },
        { title: 'Fix You', artist: 'Coldplay', album: 'X&Y' }
      ],
      angry: [
        { title: 'In the End', artist: 'Linkin Park', album: 'Hybrid Theory' },
        { title: 'Break Stuff', artist: 'Limp Bizkit', album: 'Significant Other' },
        { title: 'Killing in the Name', artist: 'Rage Against the Machine', album: 'Rage Against the Machine' },
        { title: 'Bodies', artist: 'Drowning Pool', album: 'Sinner' },
        { title: 'Chop Suey!', artist: 'System of a Down', album: 'Toxicity' },
        { title: 'Down with the Sickness', artist: 'Disturbed', album: 'The Sickness' }
      ],
      neutral: [
        { title: 'Weightless', artist: 'Marconi Union', album: 'Weightless' },
        { title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite Bergamasque' },
        { title: 'River Flows in You', artist: 'Yiruma', album: 'First Love' },
        { title: 'Porcelain', artist: 'Moby', album: 'Play' },
        { title: 'Breathe', artist: 'Télépopmusik', album: 'Genetic World' },
        { title: 'Aqueous Transmission', artist: 'Incubus', album: 'Morning View' }
      ]
    };

    return dummyData[emotion.toLowerCase()] || dummyData.neutral;
  };

  const handleRefresh = () => {
    if (detectedEmotion) {
      fetchMusicRecommendations(detectedEmotion.emotion);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    if (detectedEmotion) {
      fetchMusicRecommendations(detectedEmotion.emotion);
    }
  };

  const handleLikeSong = async (track) => {
    try {
      await musicAPI.likeSong({
        song_title: track.title,
        artist: track.artist,
        album_art_url: null,
        spotify_track_id: track.id,
        spotify_preview_url: track.preview_url,
        genre: track.album,
        emotion_detected: detectedEmotion?.emotion
      });
      alert(`❤️ Added "${track.title}" to your liked songs!`);
    } catch (err) {
      console.error('Error liking song:', err);
      alert('Failed to like song. Please try again.');
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
          <span style={{ opacity: 0.9, marginRight: '15px' }}>
            Welcome, {user?.name || 'User'}
          </span>
          <div 
            className="profile-icon"
            onClick={() => navigate('/profile')}
            title="View Profile"
          >
            👤
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              background: 'var(--warning-gradient)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
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
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Emotion Detection Studio
          </h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="glass-card">
          {/* Upload Section */}
          <div className="upload-section">
            <h3 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>
              📸 Upload or Capture Your Photo
            </h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div className="upload-buttons">
  <button 
    className="btn btn-primary"
    onClick={handleUploadClick}
    style={{ width: 'auto', padding: '15px 30px' }}
  >
    📁 Upload Image
  </button>
  <button 
    className="btn btn-secondary"
    onClick={() => setShowWebcam(true)}
    style={{ width: 'auto', padding: '15px 30px' }}
  >
    📷 Capture from Camera
  </button>
</div>

            {imagePreview && (
              <div style={{ marginTop: '20px' }}>
                <img 
                  src={imagePreview} 
                  alt="Selected" 
                  className="upload-preview"
                  style={{ maxWidth: '400px', borderRadius: '15px', border: '2px solid var(--glass-border)' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleDetectEmotion}
                  disabled={detecting}
                  style={{ marginTop: '20px', maxWidth: '400px' }}
                >
                  {detecting ? (
                    <>
                      <span className="loading-spinner"></span> Detecting Emotion...
                    </>
                  ) : (
                    '🧠 Detect Emotion'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Detected Emotion Display */}
          {detectedEmotion && (
            <div className="dominant-emotion">
              <div className="emotion-icon-large">
                {detectedEmotion.emoji}
              </div>
              <div className="emotion-name-large">
                {detectedEmotion.emotion.charAt(0).toUpperCase() + detectedEmotion.emotion.slice(1)}
              </div>
              <div className="confidence-badge">
                {(detectedEmotion.confidence * 100).toFixed(1)}% Confident
              </div>
            </div>
          )}

          {/* Music Recommendations */}
          {detectedEmotion && (
            <div style={{ marginTop: '50px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'var(--secondary-gradient)',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    🎵
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '5px' }}>
                      Recommended Music
                    </h3>
                    <p style={{ opacity: 0.7, margin: 0 }}>
                      Based on your {detectedEmotion.emotion} mood
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="form-select"
                    style={{ width: 'auto', padding: '12px 20px' }}
                  >
                    <option value="english">🇺🇸 English</option>
                    <option value="hindi">🇮🇳 Hindi</option>
                    <option value="spanish">🇪🇸 Spanish</option>
                    <option value="french">🇫🇷 French</option>
                    <option value="german">🇩🇪 German</option>
                    <option value="italian">🇮🇹 Italian</option>
                    <option value="portuguese">🇧🇷 Portuguese</option>
                  </select>

                  <button
                    onClick={handleRefresh}
                    style={{
                      padding: '12px 20px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {loadingMusic ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span>
                  <p style={{ marginTop: '20px' }}>Loading recommendations...</p>
                </div>
              ) : (
                <div className="music-grid">
                  {recommendations.map((track, index) => (
                    <div key={index} className="music-card">
                      <div className="music-artwork">
                        🎵
                      </div>
                      <div className="music-title">{track.title}</div>
                      <div className="music-artist">{track.artist}</div>
                      <div style={{
                        fontSize: '0.85rem',
                        opacity: 0.6,
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        display: 'inline-block',
                        marginBottom: '15px'
                      }}>
                        {track.album}
                      </div>
                      <div className="music-actions">
                        <button className="action-btn play-btn">
                          ▶️ Play
                        </button>
                        <button 
                          className="action-btn like-btn"
                          onClick={() => handleLikeSong(track)}
                        >
                          ❤️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div> 
    
    {showWebcam && (
      <WebcamCapture
        onCapture={(file, preview) => {
          setSelectedImage(file);
          setImagePreview(preview);
          setShowWebcam(false);
        }}
        onClose={() => setShowWebcam(false)}
      />
    )}
  </div>
);
};
  
export default MainApp;
