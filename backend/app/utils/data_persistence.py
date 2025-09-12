"""
Data persistence utilities for backing up and restoring important data
"""

import json
import os
from datetime import datetime
from app import db
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.audit_log import AuditLog

class DataPersistence:
    """Handle data backup and restoration"""
    
    @staticmethod
    def backup_users():
        """Backup user data to JSON file"""
        try:
            users = User.query.all()
            user_data = []
            
            for user in users:
                user_data.append({
                    'name': user.name,
                    'email': user.email,
                    'password': 'backup_hash',  # Don't backup actual passwords
                    'role': user.role.value,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                })
            
            backup_file = f"backup_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(backup_file, 'w') as f:
                json.dump(user_data, f, indent=2)
            
            print(f"✅ Users backed up to {backup_file}")
            return backup_file
            
        except Exception as e:
            print(f"❌ Error backing up users: {e}")
            return None
    
    @staticmethod
    def restore_users_from_backup(backup_file):
        """Restore users from backup file"""
        try:
            if not os.path.exists(backup_file):
                print(f"❌ Backup file not found: {backup_file}")
                return False
            
            with open(backup_file, 'r') as f:
                user_data = json.load(f)
            
            for user_info in user_data:
                # Check if user already exists
                existing_user = User.query.filter_by(email=user_info['email']).first()
                if not existing_user:
                    # Create new user with default password
                    user = User(
                        name=user_info['name'],
                        email=user_info['email'],
                        password='restored123',  # Default password for restored users
                        role=UserRole(user_info['role'])
                    )
                    db.session.add(user)
                    print(f"✅ Restored user: {user_info['email']}")
                else:
                    print(f"ℹ️  User already exists: {user_info['email']}")
            
            db.session.commit()
            print("✅ Users restored successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error restoring users: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def ensure_test_users():
        """Ensure test users exist (with better error handling)"""
        try:
            users_created = 0
            
            # Admin user
            admin_user = User.query.filter_by(email='admin@cvss.com').first()
            if not admin_user:
                admin_user = User(
                    name='Admin User',
                    email='admin@cvss.com',
                    password='admin123',
                    role=UserRole.ADMIN
                )
                db.session.add(admin_user)
                users_created += 1
                print("✅ Admin user created")
            
            # Analyst user
            analyst_user = User.query.filter_by(email='analyst@cvss.com').first()
            if not analyst_user:
                analyst_user = User(
                    name='Analyst User',
                    email='analyst@cvss.com',
                    password='analyst123',
                    role=UserRole.ANALYST
                )
                db.session.add(analyst_user)
                users_created += 1
                print("✅ Analyst user created")
            
            # Viewer user
            viewer_user = User.query.filter_by(email='viewer@cvss.com').first()
            if not viewer_user:
                viewer_user = User(
                    name='Viewer User',
                    email='viewer@cvss.com',
                    password='viewer123',
                    role=UserRole.VIEWER
                )
                db.session.add(viewer_user)
                users_created += 1
                print("✅ Viewer user created")
            
            if users_created > 0:
                db.session.commit()
                print(f"✅ Created {users_created} test users")
            else:
                print("ℹ️  All test users already exist")
            
            return True
            
        except Exception as e:
            print(f"❌ Error ensuring test users: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_database_info():
        """Get information about the current database"""
        try:
            info = {
                'users_count': User.query.count(),
                'vulnerabilities_count': Vulnerability.query.count(),
                'audit_logs_count': AuditLog.query.count(),
                'database_type': 'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite',
                'test_users_exist': {
                    'admin': User.query.filter_by(email='admin@cvss.com').first() is not None,
                    'analyst': User.query.filter_by(email='analyst@cvss.com').first() is not None,
                    'viewer': User.query.filter_by(email='viewer@cvss.com').first() is not None
                }
            }
            return info
        except Exception as e:
            return {'error': str(e)}
