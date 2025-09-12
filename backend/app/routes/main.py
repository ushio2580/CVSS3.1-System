from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """API root endpoint"""
    return jsonify({
        'message': 'CVSS Scoring System API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'dashboard': '/api/dashboard',
            'export': '/api/export',
            'vulnerabilities': '/api/vulns'
        }
    })

@main_bp.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'API is running'
    })

@main_bp.route('/test-jwt')
@jwt_required()
def test_jwt():
    """Test JWT authentication"""
    current_user_id = get_jwt_identity()
    return jsonify({
        'message': 'JWT authentication working',
        'user_id': current_user_id
    })
