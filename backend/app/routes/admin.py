from flask import Blueprint, jsonify, request
from app import db
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.audit_log import AuditLog
from app.utils.data_persistence import DataPersistence
from sqlalchemy import text
import json
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/init-db', methods=['POST'])
def init_database():
    """Initialize database with test data"""
    try:
        # Create admin user
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
        
        # Create analyst user
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
        
        # Create viewer user
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
        
        # Add some test vulnerabilities
        if Vulnerability.query.count() == 0:
            # Test vulnerability 1
            vuln1 = Vulnerability(
                title='SQL Injection in Login Form',
                cve_id='CVE-2024-0001',
                description='SQL injection vulnerability in the login form allows unauthorized access',
                vector='CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
                base_score=9.8,
                severity=Severity.CRITICAL,
                status=Status.OPEN,
                source=Source.INTERNAL,
                owner_id=admin_user.id
            )
            db.session.add(vuln1)
            
            # Test vulnerability 2
            vuln2 = Vulnerability(
                title='Cross-Site Scripting (XSS)',
                cve_id='CVE-2024-0002',
                description='Reflected XSS vulnerability in search functionality',
                vector='CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
                base_score=6.1,
                severity=Severity.MEDIUM,
                status=Status.MITIGATING,
                source=Source.NVD,
                owner_id=analyst_user.id
            )
            db.session.add(vuln2)
            
            # Test vulnerability 3
            vuln3 = Vulnerability(
                title='Weak Password Policy',
                cve_id='CVE-2024-0003',
                description='Password policy allows weak passwords',
                vector='CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N',
                base_score=5.3,
                severity=Severity.MEDIUM,
                status=Status.OPEN,
                source=Source.INTERNAL,
                owner_id=admin_user.id
            )
            db.session.add(vuln3)
            
            print("✅ Test vulnerabilities created")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Database initialized successfully',
            'users_created': {
                'admin': 'admin@cvss.com / admin123',
                'analyst': 'analyst@cvss.com / analyst123',
                'viewer': 'viewer@cvss.com / viewer123'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to initialize database: {str(e)}'}), 500

@admin_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))
        
        # Count users
        user_count = User.query.count()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'users_count': user_count,
            'message': 'CVSS Scoring System is running'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@admin_bp.route('/database-status', methods=['GET'])
def database_status():
    """Get detailed database status and information"""
    try:
        # Get database info
        db_info = DataPersistence.get_database_info()
        
        # Get database type
        database_type = 'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite'
        
        # Check if data persists
        data_persistence = {
            'database_type': database_type,
            'is_persistent': database_type == 'PostgreSQL',
            'explanation': 'PostgreSQL data persists between restarts, SQLite data may be lost' if database_type == 'SQLite' else 'PostgreSQL data is persistent and survives restarts'
        }
        
        return jsonify({
            'database_info': db_info,
            'data_persistence': data_persistence,
            'environment': {
                'has_database_url': bool(os.environ.get('DATABASE_URL')),
                'database_url_set': 'Yes' if os.environ.get('DATABASE_URL') else 'No'
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to get database status: {str(e)}'
        }), 500
