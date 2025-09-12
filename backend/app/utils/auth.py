from functools import wraps
from flask import request, jsonify
from app.routes.auth import verify_simple_token

def simple_auth_required(f):
    """Simple authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_simple_token(token)
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Add user_id to request context
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function
