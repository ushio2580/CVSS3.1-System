from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.user import User, UserRole

def admin_required(f):
    """Decorator to require admin role"""
    @jwt_required()
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user or not current_user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Add user to request context
        request.current_user = current_user
        return f(*args, **kwargs)
    
    return decorated_function

def analyst_required(f):
    """Decorator to require analyst or admin role"""
    @jwt_required()
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user or not current_user.is_analyst():
            return jsonify({'error': 'Analyst access required'}), 403
        
        # Add user to request context
        request.current_user = current_user
        return f(*args, **kwargs)
    
    return decorated_function

def viewer_required(f):
    """Decorator to require any authenticated user"""
    @jwt_required()
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Add user to request context
        request.current_user = current_user
        return f(*args, **kwargs)
    
    return decorated_function

def role_required(allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @jwt_required()
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            current_user = User.query.get(int(current_user_id))
            
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if current_user.role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            # Add user to request context
            request.current_user = current_user
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
