import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # Server Configuration
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///database/emotune.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Spotify API Configuration
    SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
    SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:5000/callback')
    
    # Model Configuration
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'best_model.keras')
    CLASS_INDICES_PATH = os.path.join(os.path.dirname(__file__), 'model', 'class_indices.json')
    
    # Image Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    
    # Image Processing Configuration
    IMAGE_SIZE = (75, 75)  # Must match your model's input size
    GRAYSCALE = True
    
    # Profile Picture Configuration
    PROFILE_PICTURE_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'profiles')
    DEFAULT_PROFILE_PICTURE = 'default_avatar.png'
    
    # CORS Configuration
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',  # Vite dev server
        'http://127.0.0.1:5173'
    ]
    
    # Emotion to Genre Mapping
    EMOTION_GENRE_MAP = {
        'happy': ['pop', 'dance', 'party', 'happy'],
        'sad': ['acoustic', 'indie', 'sad', 'piano'],
        'angry': ['rock', 'metal', 'hard-rock', 'punk'],
        'neutral': ['chill', 'ambient', 'lo-fi', 'jazz'],
        'surprised': ['electronic', 'edm', 'dance', 'pop'],
        'fearful': ['classical', 'calm', 'ambient', 'meditation'],
        'disgusted': ['punk', 'alternative', 'indie', 'rock'],
        'excited': ['dance', 'electronic', 'upbeat', 'party']
    }
    
    # Language to Spotify Market Code Mapping
    LANGUAGE_MARKET_MAP = {
        'english': 'US',
        'hindi': 'IN',
        'spanish': 'ES',
        'french': 'FR',
        'german': 'DE',
        'italian': 'IT',
        'portuguese': 'BR'
    }
    
    # Emotion Display Configuration
    EMOTION_EMOJIS = {
        'happy': '😊',
        'sad': '😢',
        'angry': '😠',
        'neutral': '😐',
        'surprised': '😲',
        'fearful': '😰',
        'disgusted': '🤢',
        'excited': '🤩'
    }
    
    # Password Reset Configuration
    RESET_CODE_EXPIRY = timedelta(minutes=15)  # Reset codes expire in 15 minutes
    RESET_CODE_LENGTH = 6  # 6-digit reset code
    
    @staticmethod
    def init_app(app):
        """Initialize application with configuration"""
        # Create necessary directories
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.PROFILE_PICTURE_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(os.path.dirname(__file__), 'database'), exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}