from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from utils.image_processor import ImageProcessor
from utils.emotion_detector import EmotionDetector
from config import Config

emotion_bp = Blueprint('emotion', __name__, url_prefix='/api/emotion')

# Initialize processors
image_processor = ImageProcessor()
emotion_detector = EmotionDetector()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return image_processor.validate_file_extension(filename)

@emotion_bp.route('/detect-upload', methods=['POST'])
@jwt_required()
def detect_emotion_upload():
    """
    Detect emotion from uploaded image
    
    Expects multipart/form-data with 'image' file
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': f'Invalid file type. Allowed types: {", ".join(Config.ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        
        # Save file temporarily
        file.save(filepath)
        
        try:
            # Process image
            preprocessed_face, original_image, face_coords = image_processor.process_uploaded_file(filepath)
            
            if preprocessed_face is None:
                return jsonify({
                    'success': False,
                    'message': 'No face detected in the image. Please upload an image with a clear face.'
                }), 400
            
            # Predict emotion
            prediction = emotion_detector.predict_emotion(preprocessed_face)
            
            if not prediction:
                return jsonify({
                    'success': False,
                    'message': 'Failed to detect emotion'
                }), 500
            
            # Get emoji for emotion
            emoji = emotion_detector.get_emotion_emoji(prediction['emotion'])
            
            response_data = {
                'success': True,
                'emotion': prediction['emotion'],
                'confidence': prediction['confidence'],
                'emoji': emoji,
                'all_predictions': prediction['all_predictions'],
                'face_detected': True,
                'message': f"Detected emotion: {prediction['emotion']} with {prediction['confidence']:.1%} confidence"
            }
            
            return jsonify(response_data), 200
            
        finally:
            # Clean up - delete temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
        
    except Exception as e:
        print(f"Error in detect_emotion_upload: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@emotion_bp.route('/detect-live', methods=['POST'])
@jwt_required()
def detect_emotion_live():
    """
    Detect emotion from live webcam frame (base64 encoded)
    
    Expected JSON:
    {
        "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    """
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({
                'success': False,
                'message': 'No frame data provided'
            }), 400
        
        base64_frame = data['frame']
        
        # Process base64 frame
        preprocessed_face, original_frame, face_coords = image_processor.process_base64_frame(base64_frame)
        
        if preprocessed_face is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in frame',
                'face_detected': False
            }), 200  # Not an error, just no face detected
        
        # Predict emotion
        prediction = emotion_detector.predict_emotion(preprocessed_face)
        
        if not prediction:
            return jsonify({
                'success': False,
                'message': 'Failed to detect emotion'
            }), 500
        
        # Get emoji for emotion
        emoji = emotion_detector.get_emotion_emoji(prediction['emotion'])
        
        response_data = {
            'success': True,
            'emotion': prediction['emotion'],
            'confidence': prediction['confidence'],
            'emoji': emoji,
            'all_predictions': prediction['all_predictions'],
            'face_detected': True,
            'face_coordinates': {
                'x': int(face_coords[0]),
                'y': int(face_coords[1]),
                'width': int(face_coords[2]),
                'height': int(face_coords[3])
            } if face_coords is not None else None
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in detect_emotion_live: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@emotion_bp.route('/model-info', methods=['GET'])
def get_model_info():
    """
    Get information about the emotion detection model
    No authentication required
    """
    try:
        model_info = emotion_detector.get_model_info()
        
        if not model_info:
            return jsonify({
                'success': False,
                'message': 'Model information not available'
            }), 500
        
        return jsonify({
            'success': True,
            'model_info': model_info,
            'emotion_emojis': Config.EMOTION_EMOJIS
        }), 200
        
    except Exception as e:
        print(f"Error in get_model_info: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@emotion_bp.route('/batch-detect', methods=['POST'])
@jwt_required()
def batch_detect_emotions():
    """
    Detect emotions from multiple uploaded images
    
    Expects multipart/form-data with multiple 'images' files
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Check if files are present
        if 'images' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No images provided'
            }), 400
        
        files = request.files.getlist('images')
        
        if not files or len(files) == 0:
            return jsonify({
                'success': False,
                'message': 'No files selected'
            }), 400
        
        # Limit number of images
        max_batch_size = 10
        if len(files) > max_batch_size:
            return jsonify({
                'success': False,
                'message': f'Maximum {max_batch_size} images allowed per batch'
            }), 400
        
        results = []
        
        for file in files:
            if file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'message': 'Invalid file type'
                })
                continue
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            
            try:
                # Save file
                file.save(filepath)
                
                # Process image
                preprocessed_face, _, _ = image_processor.process_uploaded_file(filepath)
                
                if preprocessed_face is None:
                    results.append({
                        'filename': file.filename,
                        'success': False,
                        'message': 'No face detected'
                    })
                    continue
                
                # Predict emotion
                prediction = emotion_detector.predict_emotion(preprocessed_face)
                
                if not prediction:
                    results.append({
                        'filename': file.filename,
                        'success': False,
                        'message': 'Failed to detect emotion'
                    })
                    continue
                
                emoji = emotion_detector.get_emotion_emoji(prediction['emotion'])
                
                results.append({
                    'filename': file.filename,
                    'success': True,
                    'emotion': prediction['emotion'],
                    'confidence': prediction['confidence'],
                    'emoji': emoji
                })
                
            finally:
                # Clean up
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results),
            'successful_detections': sum(1 for r in results if r['success'])
        }), 200
        
    except Exception as e:
        print(f"Error in batch_detect_emotions: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@emotion_bp.route('/test', methods=['GET'])
def test_emotion_detection():
    """
    Test endpoint to verify emotion detection is working
    No authentication required
    """
    try:
        model_info = emotion_detector.get_model_info()
        
        return jsonify({
            'success': True,
            'message': 'Emotion detection service is operational',
            'available_emotions': model_info['emotions'] if model_info else [],
            'model_loaded': emotion_detector.model is not None,
            'endpoints': {
                'upload': '/api/emotion/detect-upload',
                'live': '/api/emotion/detect-live',
                'batch': '/api/emotion/batch-detect',
                'info': '/api/emotion/model-info'
            }
        }), 200
        
    except Exception as e:
        print(f"Error in test_emotion_detection: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Emotion detection service error'
        }), 500