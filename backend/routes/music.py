from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from utils.db_helper import DatabaseHelper
from config import Config

music_bp = Blueprint('music', __name__, url_prefix='/api/music')
db = DatabaseHelper()

# Initialize Spotify client
def get_spotify_client():
    """Get authenticated Spotify client"""
    try:
        client_credentials_manager = SpotifyClientCredentials(
            client_id=Config.SPOTIFY_CLIENT_ID,
            client_secret=Config.SPOTIFY_CLIENT_SECRET
        )
        sp = spotipy.Spotify(
            client_credentials_manager=client_credentials_manager,
            requests_timeout=10
        )
        return sp
    except Exception as e:
        print(f"Error creating Spotify client: {str(e)}")
        return None

@music_bp.route('/recommendations/<emotion>', methods=['GET'])
@jwt_required()
def get_recommendations(emotion):
    """
    Get music recommendations based on detected emotion
    
    Query Parameters:
        - language: Language/market code (default: english)
        - limit: Number of tracks to return (default: 6, max: 20)
    
    Example: /api/music/recommendations/happy?language=hindi&limit=10
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        language = request.args.get('language', 'english').lower()
        limit = min(int(request.args.get('limit', 6)), 20)
        
        # Validate emotion
        emotion = emotion.lower()
        if emotion not in Config.EMOTION_GENRE_MAP:
            return jsonify({
                'success': False,
                'message': f'Invalid emotion. Valid emotions: {list(Config.EMOTION_GENRE_MAP.keys())}'
            }), 400
        
        # Get market code for language
        market = Config.LANGUAGE_MARKET_MAP.get(language, 'US')
        
        # Get genres for emotion
        genres = Config.EMOTION_GENRE_MAP[emotion]
        
        # Get Spotify client
        sp = get_spotify_client()
        if not sp:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to Spotify'
            }), 500
        
        # Get recommendations from Spotify
        try:
            # Use seed genres to get recommendations
            recommendations = sp.recommendations(
                seed_genres=genres[:5],  # Spotify allows max 5 seeds
                limit=limit,
                market=market
            )
            
            tracks = []
            for track in recommendations['tracks']:
                track_data = {
                    'id': track['id'],
                    'title': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'preview_url': track['preview_url'],
                    'external_url': track['external_urls']['spotify'],
                    'duration_ms': track['duration_ms'],
                    'popularity': track['popularity']
                }
                tracks.append(track_data)
            
            return jsonify({
                'success': True,
                'emotion': emotion,
                'language': language,
                'market': market,
                'tracks': tracks,
                'total': len(tracks),
                'genres_used': genres
            }), 200
            
        except Exception as e:
            print(f"Spotify API error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch recommendations from Spotify'
            }), 500
        
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/like', methods=['POST'])
@jwt_required()
def like_song():
    """
    Like/save a song to user's collection
    
    Expected JSON:
    {
        "song_title": "Song Name",
        "artist": "Artist Name",
        "album_art_url": "https://...",
        "spotify_track_id": "spotify_id",
        "spotify_preview_url": "https://...",
        "genre": "pop",
        "emotion_detected": "happy"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('song_title') or not data.get('artist'):
            return jsonify({
                'success': False,
                'message': 'Song title and artist are required'
            }), 400
        
        # Check if song is already liked
        if data.get('spotify_track_id'):
            if db.is_song_liked(current_user_id, data['spotify_track_id']):
                return jsonify({
                    'success': False,
                    'message': 'Song is already in your liked songs'
                }), 409
        
        # Add to liked songs
        song_id = db.add_liked_song(
            user_id=current_user_id,
            song_title=data['song_title'],
            artist=data['artist'],
            album_art_url=data.get('album_art_url'),
            spotify_track_id=data.get('spotify_track_id'),
            spotify_preview_url=data.get('spotify_preview_url'),
            genre=data.get('genre'),
            emotion_detected=data.get('emotion_detected')
        )
        
        if not song_id:
            return jsonify({
                'success': False,
                'message': 'Failed to add song to liked songs'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Song added to liked songs',
            'song_id': song_id
        }), 201
        
    except Exception as e:
        print(f"Error in like_song: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/unlike/<int:song_id>', methods=['DELETE'])
@jwt_required()
def unlike_song(song_id):
    """
    Unlike/remove a song from user's collection
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Remove from liked songs
        success = db.remove_liked_song(current_user_id, song_id)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Failed to remove song from liked songs'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Song removed from liked songs'
        }), 200
        
    except Exception as e:
        print(f"Error in unlike_song: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/liked', methods=['GET'])
@jwt_required()
def get_liked_songs():
    """
    Get all liked songs for the current user
    
    Query Parameters:
        - limit: Number of songs to return (optional)
        - emotion: Filter by emotion (optional)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', type=int)
        emotion_filter = request.args.get('emotion')
        
        # Get liked songs
        liked_songs = db.get_liked_songs(current_user_id, limit)
        
        # Filter by emotion if specified
        if emotion_filter:
            emotion_filter = emotion_filter.lower()
            liked_songs = [
                song for song in liked_songs 
                if song.get('emotion_detected', '').lower() == emotion_filter
            ]
        
        return jsonify({
            'success': True,
            'liked_songs': liked_songs,
            'total': len(liked_songs)
        }), 200
        
    except Exception as e:
        print(f"Error in get_liked_songs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/search', methods=['GET'])
@jwt_required()
def search_tracks():
    """
    Search for tracks on Spotify
    
    Query Parameters:
        - q: Search query (required)
        - limit: Number of results (default: 10, max: 50)
        - market: Market/country code (default: US)
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        query = request.args.get('q')
        if not query:
            return jsonify({
                'success': False,
                'message': 'Search query is required'
            }), 400
        
        limit = min(int(request.args.get('limit', 10)), 50)
        market = request.args.get('market', 'US')
        
        # Get Spotify client
        sp = get_spotify_client()
        if not sp:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to Spotify'
            }), 500
        
        # Search tracks
        try:
            results = sp.search(q=query, type='track', limit=limit, market=market)
            
            tracks = []
            for track in results['tracks']['items']:
                track_data = {
                    'id': track['id'],
                    'title': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'preview_url': track['preview_url'],
                    'external_url': track['external_urls']['spotify'],
                    'duration_ms': track['duration_ms'],
                    'popularity': track['popularity']
                }
                tracks.append(track_data)
            
            return jsonify({
                'success': True,
                'query': query,
                'tracks': tracks,
                'total': len(tracks)
            }), 200
            
        except Exception as e:
            print(f"Spotify search error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to search tracks on Spotify'
            }), 500
        
    except Exception as e:
        print(f"Error in search_tracks: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/track/<track_id>', methods=['GET'])
@jwt_required()
def get_track_details(track_id):
    """
    Get detailed information about a specific track
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get Spotify client
        sp = get_spotify_client()
        if not sp:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to Spotify'
            }), 500
        
        try:
            # Get track details
            track = sp.track(track_id)
            
            # Get audio features
            audio_features = sp.audio_features([track_id])[0]
            
            track_data = {
                'id': track['id'],
                'title': track['name'],
                'artist': ', '.join([artist['name'] for artist in track['artists']]),
                'album': track['album']['name'],
                'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'preview_url': track['preview_url'],
                'external_url': track['external_urls']['spotify'],
                'duration_ms': track['duration_ms'],
                'popularity': track['popularity'],
                'release_date': track['album']['release_date'],
                'audio_features': {
                    'danceability': audio_features['danceability'] if audio_features else None,
                    'energy': audio_features['energy'] if audio_features else None,
                    'valence': audio_features['valence'] if audio_features else None,
                    'tempo': audio_features['tempo'] if audio_features else None
                }
            }
            
            return jsonify({
                'success': True,
                'track': track_data
            }), 200
            
        except Exception as e:
            print(f"Spotify API error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch track details from Spotify'
            }), 500
        
    except Exception as e:
        print(f"Error in get_track_details: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/genres', methods=['GET'])
def get_available_genres():
    """
    Get list of available genres from Spotify
    No authentication required
    """
    try:
        # Get Spotify client
        sp = get_spotify_client()
        if not sp:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to Spotify'
            }), 500
        
        try:
            # Get available genre seeds
            genres = sp.recommendation_genre_seeds()
            
            return jsonify({
                'success': True,
                'genres': genres['genres'],
                'total': len(genres['genres'])
            }), 200
            
        except Exception as e:
            print(f"Spotify API error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch genres from Spotify'
            }), 500
        
    except Exception as e:
        print(f"Error in get_available_genres: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@music_bp.route('/test', methods=['GET'])
def test_spotify_connection():
    """
    Test Spotify API connection
    No authentication required
    """
    try:
        sp = get_spotify_client()
        
        if not sp:
            return jsonify({
                'success': False,
                'message': 'Failed to create Spotify client. Check your credentials.',
                'spotify_configured': False
            }), 500
        
        # Try a simple API call
        try:
            genres = sp.recommendation_genre_seeds()
            
            return jsonify({
                'success': True,
                'message': 'Spotify API connection successful',
                'spotify_configured': True,
                'available_genres_count': len(genres['genres']),
                'emotion_genre_mapping': Config.EMOTION_GENRE_MAP,
                'supported_languages': list(Config.LANGUAGE_MARKET_MAP.keys())
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Spotify API error: {str(e)}',
                'spotify_configured': False
            }), 500
        
    except Exception as e:
        print(f"Error in test_spotify_connection: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
