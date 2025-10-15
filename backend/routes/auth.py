from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from utils.db_helper import DatabaseHelper
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
db = DatabaseHelper()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Expected JSON:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "SecurePass123",
        "preferred_genres": "Pop, Rock, Indie"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'{field.capitalize()} is required'
                }), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        preferred_genres = data.get('preferred_genres', '')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message
            }), 400
        
        # Check if user already exists
        existing_user = db.get_user_by_email(email)
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'User with this email already exists'
            }), 409
        
        # Create user
        user_id = db.create_user(name, email, password, preferred_genres)
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Failed to create user'
            }), 500
        
        # Get created user
        user = db.get_user_by_id(user_id)
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'profile_picture': user['profile_picture'],
                'preferred_genres': user['preferred_genres'],
                'created_at': user['created_at']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        print(f"Error in register: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    
    Expected JSON:
    {
        "email": "john@example.com",
        "password": "SecurePass123"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Verify credentials
        user = db.verify_password(email, password)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Create tokens
        access_token = create_access_token(identity=user['id'])
        refresh_token = create_refresh_token(identity=user['id'])
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'profile_picture': user['profile_picture'],
                'preferred_genres': user['preferred_genres'],
                'created_at': user['created_at']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        print(f"Error in login: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Create new access token
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'success': True,
            'access_token': access_token
        }), 200
        
    except Exception as e:
        print(f"Error in refresh: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset code
    
    Expected JSON:
    {
        "email": "john@example.com"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        email = data['email'].strip().lower()
        
        # Check if user exists
        user = db.get_user_by_email(email)
        
        if not user:
            # Don't reveal if email exists or not (security best practice)
            return jsonify({
                'success': True,
                'message': 'If the email exists, a reset code has been sent'
            }), 200
        
        # Generate reset code
        reset_code = db.create_reset_code(user['id'])
        
        if not reset_code:
            return jsonify({
                'success': False,
                'message': 'Failed to generate reset code'
            }), 500
        
        # In production, send this via email
        # For development, we'll return it in response
        print(f"🔑 Password Reset Code for {email}: {reset_code}")
        
        return jsonify({
            'success': True,
            'message': 'Reset code generated successfully',
            'reset_code': reset_code,  # Remove this in production!
            'note': 'In production, this code would be sent via email'
        }), 200
        
    except Exception as e:
        print(f"Error in forgot_password: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """
    Verify password reset code
    
    Expected JSON:
    {
        "email": "john@example.com",
        "code": "123456"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('code'):
            return jsonify({
                'success': False,
                'message': 'Email and code are required'
            }), 400
        
        email = data['email'].strip().lower()
        code = data['code'].strip()
        
        # Verify code
        is_valid = db.verify_reset_code(email, code)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired reset code'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Reset code is valid'
        }), 200
        
    except Exception as e:
        print(f"Error in verify_reset_code: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password using reset code
    
    Expected JSON:
    {
        "email": "john@example.com",
        "code": "123456",
        "new_password": "NewSecurePass123"
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['email', 'code', 'new_password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").capitalize()} is required'
                }), 400
        
        email = data['email'].strip().lower()
        code = data['code'].strip()
        new_password = data['new_password']
        
        # Validate new password
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message
            }), 400
        
        # Reset password
        success = db.reset_password(email, code, new_password)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Failed to reset password. Invalid or expired code'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in reset_password: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@auth_bp.route('/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    """
    Validate JWT token and return user info
    """
    try:
        current_user_id = get_jwt_identity()
        
        user = db.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'profile_picture': user['profile_picture'],
                'preferred_genres': user['preferred_genres']
            }
        }), 200
        
    except Exception as e:
        print(f"Error in validate_token: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500