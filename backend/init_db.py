#!/usr/bin/env python3
"""
Database initialization script
Creates tables and adds test data
"""

from app import create_app, db
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, Severity, Status, Source

def init_database():
    """Initialize database with test data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created")
        
        # Check if admin user exists
        admin_user = User.query.filter_by(email='admin@cvss.com').first()
        if not admin_user:
            # Create admin user
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
            # Create analyst user
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
            # Create viewer user
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
        
        # Commit all changes
        db.session.commit()
        print("✅ Database initialized successfully!")
        
        print("\n📋 Test Users:")
        print("Admin: admin@cvss.com / admin123")
        print("Analyst: analyst@cvss.com / analyst123")
        print("Viewer: viewer@cvss.com / viewer123")

if __name__ == '__main__':
    init_database()
