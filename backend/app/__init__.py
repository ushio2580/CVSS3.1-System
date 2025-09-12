from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_login import LoginManager
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
login_manager = LoginManager()

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database configuration
    if os.environ.get('DATABASE_URL'):
        # Railway PostgreSQL
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    else:
        # Local SQLite
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///cvss.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development
    app.config['JWT_ALGORITHM'] = 'HS256'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'
    app.config['JWT_DECODE_ALGORITHMS'] = ['HS256']
    app.config['JWT_ENCODE_NBF'] = False
    app.config['JWT_ACCESS_CSRF_HEADER_NAME'] = 'X-CSRF-TOKEN'
    app.config['JWT_ACCESS_CSRF_FIELD_NAME'] = 'csrf_token'
    app.config['JWT_ACCESS_CSRF_CHECK_FORM'] = False
    app.config['JWT_JSON_KEY'] = 'access_token'
    app.config['JWT_IDENTITY_CLAIM'] = 'sub'
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    login_manager.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'The token has expired',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'message': 'Signature verification failed',
            'error': 'invalid_token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'description': 'Request does not contain an access token',
            'error': 'authorization_required'
        }), 401
    
    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    
    # Register blueprints
    from .routes.main import main_bp
    from .routes.auth import auth_bp
    from .routes.vulns import vulns_bp
    from .routes.dashboard import dashboard_bp
    from .routes.export import export_bp
    from .routes.bulk_upload import bulk_bp
    from .routes.audit import audit_bp
    from .routes.vulnerability_history import history_bp
    from .routes.database_manager import database_bp
    from .routes.evaluations import evaluations_bp
    from .routes.admin import admin_bp
    from .routes.document_analyzer import document_analyzer_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(vulns_bp, url_prefix='/api/vulns')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(bulk_bp, url_prefix='/api/bulk')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    app.register_blueprint(database_bp, url_prefix='/api/database')
    app.register_blueprint(evaluations_bp, url_prefix='/api/evaluations')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(document_analyzer_bp, url_prefix='/api/documents')
    
    # Import models to ensure they are registered with SQLAlchemy
    from .models.user import User
    from .models.vulnerability import Vulnerability
    from .models.evaluation import Evaluation
    from .models.audit_log import AuditLog
    from .models.vulnerability_history import VulnerabilityHistory
    from .models.database_info import DatabaseQuery
    from .models.document_analysis import DocumentAnalysis
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Initialize test users if they don't exist
        try:
            from .models.user import User, UserRole
            
            # Check if admin user exists
            admin_user = User.query.filter_by(email='admin@cvss.com').first()
            if not admin_user:
                admin_user = User(
                    name='Admin User',
                    email='admin@cvss.com',
                    password='admin123',
                    role=UserRole.ADMIN
                )
                db.session.add(admin_user)
                print("✅ Admin user created")
            
            # Check if analyst user exists
            analyst_user = User.query.filter_by(email='analyst@cvss.com').first()
            if not analyst_user:
                analyst_user = User(
                    name='Analyst User',
                    email='analyst@cvss.com',
                    password='analyst123',
                    role=UserRole.ANALYST
                )
                db.session.add(analyst_user)
                print("✅ Analyst user created")
            
            # Check if viewer user exists
            viewer_user = User.query.filter_by(email='viewer@cvss.com').first()
            if not viewer_user:
                viewer_user = User(
                    name='Viewer User',
                    email='viewer@cvss.com',
                    password='viewer123',
                    role=UserRole.VIEWER
                )
                db.session.add(viewer_user)
                print("✅ Viewer user created")
            
            db.session.commit()
            print("✅ Database initialized with test users")
            
        except Exception as e:
            print(f"⚠️  Warning: Could not initialize test users: {e}")
            db.session.rollback()
    
    return app

