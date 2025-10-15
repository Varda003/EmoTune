-- EmoTune Database Schema
-- SQLite Database for User Management, Liked Songs, and Password Reset

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT 'default_avatar.png',
    preferred_genres TEXT,  -- Comma-separated genre list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Liked Songs Table (Replaces Listening History)
CREATE TABLE IF NOT EXISTS liked_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album_art_url TEXT,
    spotify_track_id TEXT,
    spotify_preview_url TEXT,
    genre TEXT,
    emotion_detected TEXT,  -- Which emotion was active when song was liked
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Codes Table
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reset_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Session Tokens Table (Optional - for token blacklisting)
CREATE TABLE IF NOT EXISTS session_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_jti TEXT UNIQUE NOT NULL,  -- JWT ID for token blacklisting
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_spotify_id ON liked_songs(spotify_track_id);
CREATE INDEX IF NOT EXISTS idx_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON password_reset_codes(reset_code);
CREATE INDEX IF NOT EXISTS idx_session_tokens_jti ON session_tokens(token_jti);

-- Trigger to update updated_at timestamp on users table
CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- View to get user statistics
CREATE VIEW IF NOT EXISTS user_statistics AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT ls.id) as total_liked_songs,
    COUNT(DISTINCT ls.emotion_detected) as emotions_explored,
    MAX(ls.liked_at) as last_activity
FROM users u
LEFT JOIN liked_songs ls ON u.id = ls.user_id
GROUP BY u.id;