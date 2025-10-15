from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import os

# Import routes
from routes.auth import auth_bp
from routes.emotion import emotion_bp
from routes.music import music_bp
from routes.user import user_bp

def create_app(config_name='development'):
    """
    Application factory pattern
    Creates and configures the Flask application
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize configuration
    Config.init_app(app)
    
    # Initialize CORS
    CORS(app, 
         origins=Config.CORS_ORIGINS,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has expired',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Invalid token',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authorization token is missing',
            'error': 'authorization_required'
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has been revoked',
            'error': 'token_revoked'
        }), 401
    
    # Register blueprints (routes)
    app.register_blueprint(auth_bp)
    app.register_blueprint(emotion_bp)
    app.register_blueprint(music_bp)
    app.register_blueprint(user_bp)
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'success': True,
            'message': 'EmoTune API - Emotion-Based Music Recommender',
            'version': '1.0.0',
            'endpoints': {
                'authentication': {
                    'register': 'POST /api/auth/register',
                    'login': 'POST /api/auth/login',
                    'refresh': 'POST /api/auth/refresh',
                    'forgot_password': 'POST /api/auth/forgot-password',
                    'verify_reset_code': 'POST /api/auth/verify-reset-code',
                    'reset_password': 'POST /api/auth/reset-password',
                    'validate_token': 'GET /api/auth/validate-token'
                },
                'emotion_detection': {
                    'upload_image': 'POST /api/emotion/detect-upload',
                    'live_camera': 'POST /api/emotion/detect-live',
                    'batch_detect': 'POST /api/emotion/batch-detect',
                    'model_info': 'GET /api/emotion/model-info',
                    'test': 'GET /api/emotion/test'
                },
                'music': {
                    'recommendations': 'GET /api/music/recommendations/<emotion>',
                    'like_song': 'POST /api/music/like',
                    'unlike_song': 'DELETE /api/music/unlike/<song_id>',
                    'liked_songs': 'GET /api/music/liked',
                    'search': 'GET /api/music/search',
                    'track_details': 'GET /api/music/track/<track_id>',
                    'genres': 'GET /api/music/genres',
                    'test': 'GET /api/music/test'
                },
                'user': {
                    'profile': 'GET /api/user/profile',
                    'edit_profile': 'PUT /api/user/profile/edit',
                    'upload_picture': 'POST /api/user/profile/picture',
                    'get_picture': 'GET /api/user/profile/picture/<filename>',
                    'delete_account': 'DELETE /api/user/account',
                    'statistics': 'GET /api/user/statistics',
                    'preferences': 'GET /api/user/preferences'
                }
            },
            'documentation': 'Visit /api/docs for detailed API documentation'
        }), 200
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Check if all services are running"""
        health_status = {
            'api': 'healthy',
            'database': 'unknown',
            'emotion_model': 'unknown',
            'spotify': 'unknown'
        }
        
        # Check database
        try:
            from utils.db_helper import DatabaseHelper
            db = DatabaseHelper()
            conn = db.get_connection()
            conn.close()
            health_status['database'] = 'healthy'
        except Exception as e:
            health_status['database'] = f'error: {str(e)}'
        
        # Check emotion model
        try:
            from utils.emotion_detector import EmotionDetector
            detector = EmotionDetector()
            if detector.model is not None:
                health_status['emotion_model'] = 'healthy'
            else:
                health_status['emotion_model'] = 'not loaded'
        except Exception as e:
            health_status['emotion_model'] = f'error: {str(e)}'
        
        # Check Spotify
        try:
            from routes.music import get_spotify_client
            sp = get_spotify_client()
            if sp:
                sp.recommendation_genre_seeds()
                health_status['spotify'] = 'healthy'
            else:
                health_status['spotify'] = 'not configured'
        except Exception as e:
            health_status['spotify'] = f'error: {str(e)}'
        
        # Overall status
        all_healthy = all(status == 'healthy' for status in health_status.values())
        
        return jsonify({
            'success': all_healthy,
            'status': 'healthy' if all_healthy else 'degraded',
            'services': health_status
        }), 200 if all_healthy else 503
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found',
            'error': 'not_found'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'message': 'Method not allowed',
            'error': 'method_not_allowed'
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': 'internal_server_error'
        }), 500
    
    # Request logging (optional - for development)
    if Config.DEBUG:
        @app.before_request
        def log_request():
            from flask import request
            print(f"\n{'='*50}")
            print(f"📥 {request.method} {request.path}")
            if request.get_json(silent=True):
                print(f"📦 Body: {request.get_json()}")
            print(f"{'='*50}\n")
        
        @app.after_request
        def log_response(response):
            print(f"\n{'='*50}")
            print(f"📤 Response Status: {response.status_code}")
            print(f"{'='*50}\n")
            return response
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎵 EmoTune Backend Server Starting...")
    print("="*60)
    
    # Display configuration
    print(f"\n📋 Configuration:")
    print(f"   - Environment: {Config.FLASK_ENV}")
    print(f"   - Debug Mode: {Config.DEBUG}")
    print(f"   - Host: {Config.HOST}")
    print(f"   - Port: {Config.PORT}")
    print(f"   - Model Path: {Config.MODEL_PATH}")
    print(f"   - Database: {Config.DATABASE_URL}")
    
    # Check critical configurations
    print(f"\n🔧 Service Status:")
    
    # Check Spotify credentials
    if Config.SPOTIFY_CLIENT_ID and Config.SPOTIFY_CLIENT_SECRET:
        print(f"   ✅ Spotify API: Configured")
    else:
        print(f"   ⚠️  Spotify API: Not configured (check .env file)")
    
    # Check model file
    if os.path.exists(Config.MODEL_PATH):
        print(f"   ✅ Emotion Model: Found")
    else:
        print(f"   ❌ Emotion Model: Not found at {Config.MODEL_PATH}")
    
    # Check class indices
    if os.path.exists(Config.CLASS_INDICES_PATH):
        print(f"   ✅ Class Indices: Found")
    else:
        print(f"   ❌ Class Indices: Not found at {Config.CLASS_INDICES_PATH}")
    
    print(f"\n🚀 Available Endpoints:")
    print(f"   - Root: http://{Config.HOST}:{Config.PORT}/")
    print(f"   - Health: http://{Config.HOST}:{Config.PORT}/health")
    print(f"   - Auth: http://{Config.HOST}:{Config.PORT}/api/auth/*")
    print(f"   - Emotion: http://{Config.HOST}:{Config.PORT}/api/emotion/*")
    print(f"   - Music: http://{Config.HOST}:{Config.PORT}/api/music/*")
    print(f"   - User: http://{Config.HOST}:{Config.PORT}/api/user/*")
    
    print("\n" + "="*60)
    print("🎉 Server is ready! Press CTRL+C to stop.")
    print("="*60 + "\n")
    
    # Run the application
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )