from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_login import login_user, logout_user, login_required, current_user
from app.utils.ip_utils import get_client_ip
from app import db
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.utils.authorization import admin_required
from app.utils.audit_decorator import audit_log
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import secrets
import json

auth_bp = Blueprint('auth', __name__)

# Simple token storage (in production, use Redis or database)
SIMPLE_TOKENS = {}

def generate_simple_token():
    """Generate a simple token for authentication"""
    return secrets.token_urlsafe(32)

def verify_simple_token(token):
    """Verify a simple token"""
    if token in SIMPLE_TOKENS:
        user_data = SIMPLE_TOKENS[token]
        # Check if token is not expired (24 hours)
        if datetime.utcnow() - user_data['created_at'] < timedelta(hours=24):
            return user_data['user_id']
    return None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User with this email already exists'}), 409
    
    # Create new user
    try:
        role = UserRole(data.get('role', 'viewer'))
        user = User(
            name=data['name'],
            email=data['email'],
            password=data['password'],
            role=role
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Log the registration
        audit_log = AuditLog(
            user_id=user.id,
            username=user.name,
            action='REGISTER',
            target_type='user',
            target_id=user.id,
            target_name=user.email,
            details=json.dumps({'email': user.email, 'role': user.role.value}),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
@audit_log(
    action='LOGIN',
    target_type='user',
    get_target_id=lambda req, res, *args, **kwargs: None,
    get_target_name=lambda req, res, *args, **kwargs: req.get_json().get('email') if req.is_json else None,
    require_auth=False
)
def login():
    """Login user and return JWT token"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create JWT token
    access_token = create_access_token(
        identity=str(user.id),  # Convert to string
        expires_delta=timedelta(hours=24)
    )
    
    # Log the login
    audit_log = AuditLog(
        user_id=user.id,
        username=user.name,
        action='LOGIN',
        target_type='user',
        target_id=user.id,
        target_name=user.email,
        details=json.dumps({'email': user.email}),
        ip_address=get_client_ip(),
        user_agent=request.headers.get('User-Agent', '')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/login-simple', methods=['POST'])
def login_simple():
    """Simple login without JWT - just return user data"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
@audit_log(
    action='LOGOUT',
    target_type='user',
    get_target_id=lambda req, res, *args, **kwargs: get_jwt_identity(),
    get_target_name=lambda req, res, *args, **kwargs: 'User logout'
)
def logout():
    """Logout user"""
    current_user_id = get_jwt_identity()
    
    # Log the logout
    user = User.query.get(current_user_id)
    audit_log = AuditLog(
        user_id=current_user_id,
        username=user.name if user else 'Unknown',
        action='LOGOUT',
        target_type='user',
        target_id=current_user_id,
        target_name=user.email if user else 'Unknown',
        ip_address=get_client_ip(),
        user_agent=request.headers.get('User-Agent', '')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/logout-simple', methods=['POST'])
def logout_simple():
    """Simple logout"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token in SIMPLE_TOKENS:
        del SIMPLE_TOKENS[token]
    
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))  # Convert back to int
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile-simple', methods=['GET'])
def get_profile_simple():
    """Get current user profile using simple token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_simple_token(token)
    
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    """Get current user permissions"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    permissions = {
        'can_create_vulnerabilities': current_user.is_analyst(),
        'can_edit_vulnerabilities': current_user.is_analyst(),
        'can_delete_vulnerabilities': current_user.is_admin(),
        'can_manage_users': current_user.is_admin(),
        'can_export': True,  # All authenticated users can export
        'can_view_audit_logs': current_user.is_admin(),  # Only admins can view audit logs
        'role': current_user.role.value
    }
    
    return jsonify(permissions), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if data.get('name'):
        user.name = data['name']
    
    if data.get('email'):
        # Check if email is already taken
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != current_user_id:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']
    
    if data.get('password'):
        user.set_password(data['password'])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only)"""
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200

@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_by_id(user_id):
    """Get user by ID (Admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update user (Admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if data.get('name'):
            user.name = data['name']
        if data.get('email'):
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        if data.get('role'):
            user.role = UserRole(data['role'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete user (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
