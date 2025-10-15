import sqlite3
import os
import bcrypt
from datetime import datetime, timedelta
import random
import string
from config import Config

class DatabaseHelper:
    """Handles all database operations for EmoTune"""
    
    def __init__(self, db_path=None):
        if db_path is None:
            # Extract path from DATABASE_URL (remove 'sqlite:///')
            db_path = Config.DATABASE_URL.replace('sqlite:///', '')
            
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    
    def init_database(self):
        """Initialize database with schema"""
        try:
            # Read schema file
            schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
            
            with open(schema_path, 'r') as f:
                schema = f.read()
            
            # Execute schema
            conn = self.get_connection()
            conn.executescript(schema)
            conn.commit()
            conn.close()
            
            print("✅ Database initialized successfully")
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}")
            raise
    
    # ==================== USER OPERATIONS ====================
    
    def create_user(self, name, email, password, preferred_genres=None):
        """
        Create a new user
        
        Args:
            name: User's full name
            email: User's email
            password: Plain text password (will be hashed)
            preferred_genres: Comma-separated genre string
            
        Returns:
            User ID if successful, None otherwise
        """
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (name, email, password_hash, preferred_genres)
                VALUES (?, ?, ?, ?)
            ''', (name, email, password_hash, preferred_genres))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return user_id
            
        except sqlite3.IntegrityError:
            print(f"User with email {email} already exists")
            return None
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            
            conn.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            
            conn.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def verify_password(self, email, password):
        """
        Verify user password
        
        Returns:
            User dict if valid, None otherwise
        """
        user = self.get_user_by_email(email)
        
        if not user:
            return None
        
        # Check password
        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return user
        
        return None
    
    def update_user_profile(self, user_id, name=None, preferred_genres=None, profile_picture=None):
        """Update user profile"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            updates = []
            params = []
            
            if name:
                updates.append('name = ?')
                params.append(name)
            
            if preferred_genres:
                updates.append('preferred_genres = ?')
                params.append(preferred_genres)
            
            if profile_picture:
                updates.append('profile_picture = ?')
                params.append(profile_picture)
            
            if not updates:
                return False
            
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating user profile: {str(e)}")
            return False
    
    def delete_user(self, user_id):
        """Delete user account"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            return False
    
    # ==================== LIKED SONGS OPERATIONS ====================
    
    def add_liked_song(self, user_id, song_title, artist, album_art_url=None, 
                       spotify_track_id=None, spotify_preview_url=None, 
                       genre=None, emotion_detected=None):
        """Add a song to user's liked songs"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO liked_songs 
                (user_id, song_title, artist, album_art_url, spotify_track_id, 
                 spotify_preview_url, genre, emotion_detected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, song_title, artist, album_art_url, spotify_track_id,
                  spotify_preview_url, genre, emotion_detected))
            
            song_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return song_id
            
        except Exception as e:
            print(f"Error adding liked song: {str(e)}")
            return None
    
    def remove_liked_song(self, user_id, song_id):
        """Remove a song from user's liked songs"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM liked_songs 
                WHERE id = ? AND user_id = ?
            ''', (song_id, user_id))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error removing liked song: {str(e)}")
            return False
    
    def get_liked_songs(self, user_id, limit=None):
        """Get all liked songs for a user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            query = 'SELECT * FROM liked_songs WHERE user_id = ? ORDER BY liked_at DESC'
            
            if limit:
                query += f' LIMIT {limit}'
            
            cursor.execute(query, (user_id,))
            songs = cursor.fetchall()
            
            conn.close()
            
            return [dict(song) for song in songs]
            
        except Exception as e:
            print(f"Error getting liked songs: {str(e)}")
            return []
    
    def is_song_liked(self, user_id, spotify_track_id):
        """Check if a song is already liked by user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id FROM liked_songs 
                WHERE user_id = ? AND spotify_track_id = ?
            ''', (user_id, spotify_track_id))
            
            result = cursor.fetchone()
            conn.close()
            
            return result is not None
            
        except Exception as e:
            print(f"Error checking liked song: {str(e)}")
            return False
    
    # ==================== PASSWORD RESET OPERATIONS ====================
    
    def generate_reset_code(self):
        """Generate a random 6-digit reset code"""
        return ''.join(random.choices(string.digits, k=Config.RESET_CODE_LENGTH))
    
    def create_reset_code(self, user_id):
        """Create a password reset code for user"""
        try:
            code = self.generate_reset_code()
            expires_at = datetime.now() + Config.RESET_CODE_EXPIRY
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Invalidate any existing codes for this user
            cursor.execute('''
                UPDATE password_reset_codes 
                SET is_used = 1 
                WHERE user_id = ? AND is_used = 0
            ''', (user_id,))
            
            # Create new code
            cursor.execute('''
                INSERT INTO password_reset_codes 
                (user_id, reset_code, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, code, expires_at))
            
            conn.commit()
            conn.close()
            
            return code
            
        except Exception as e:
            print(f"Error creating reset code: {str(e)}")
            return None
    
    def verify_reset_code(self, email, code):
        """Verify password reset code"""
        try:
            user = self.get_user_by_email(email)
            if not user:
                return False
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM password_reset_codes 
                WHERE user_id = ? AND reset_code = ? AND is_used = 0
            ''', (user['id'], code))
            
            reset_record = cursor.fetchone()
            conn.close()
            
            if not reset_record:
                return False
            
            # Check if expired
            expires_at = datetime.fromisoformat(reset_record['expires_at'])
            if datetime.now() > expires_at:
                return False
            
            return True
            
        except Exception as e:
            print(f"Error verifying reset code: {str(e)}")
            return False
    
    def reset_password(self, email, code, new_password):
        """Reset user password using reset code"""
        try:
            if not self.verify_reset_code(email, code):
                return False
            
            user = self.get_user_by_email(email)
            if not user:
                return False
            
            # Hash new password
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Update password
            cursor.execute('''
                UPDATE users 
                SET password_hash = ? 
                WHERE id = ?
            ''', (password_hash, user['id']))
            
            # Mark code as used
            cursor.execute('''
                UPDATE password_reset_codes 
                SET is_used = 1 
                WHERE user_id = ? AND reset_code = ?
            ''', (user['id'], code))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error resetting password: {str(e)}")
            return False
    
    # ==================== STATISTICS ====================
    
    def get_user_statistics(self, user_id):
        """Get statistics for a user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM user_statistics WHERE id = ?
            ''', (user_id,))
            
            stats = cursor.fetchone()
            conn.close()
            
            return dict(stats) if stats else None
            
        except Exception as e:
            print(f"Error getting user statistics: {str(e)}")
            return None