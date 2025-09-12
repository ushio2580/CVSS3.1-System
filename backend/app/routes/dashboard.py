from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.evaluation import Evaluation
from app.models.user import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import calendar

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
def get_dashboard_summary():
    """Get dashboard summary with KPIs and charts data"""
    
    # Get date range filters
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Base query with date filter
    base_query = Vulnerability.query.filter(Vulnerability.created_at >= start_date)
    
    # KPIs - Total counts
    total_vulns = Vulnerability.query.count()
    critical_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.CRITICAL).count()
    high_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.HIGH).count()
    medium_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.MEDIUM).count()
    low_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.LOW).count()
    
    # Recent vulnerabilities (last 30 days)
    recent_vulns = base_query.count()
    
    # Distribution by severity
    severity_distribution = db.session.query(
        Vulnerability.severity,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.severity).all()
    
    severity_data = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0
    }
    
    for severity, count in severity_distribution:
        severity_data[severity.value] = count
    
    # Distribution by status
    status_distribution = db.session.query(
        Vulnerability.status,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.status).all()
    
    status_data = {
        'Open': 0,
        'Mitigating': 0,
        'Fixed': 0,
        'Accepted': 0
    }
    
    for status, count in status_distribution:
        status_data[status.value] = count
    
    # Top 10 vulnerabilities by score
    top_vulns = Vulnerability.query.filter(
        Vulnerability.base_score.isnot(None)
    ).order_by(desc(Vulnerability.base_score)).limit(10).all()
    
    # Trend data - vulnerabilities created per day
    trend_data = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=i)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        count = Vulnerability.query.filter(
            Vulnerability.created_at >= start_of_day,
            Vulnerability.created_at < end_of_day
        ).count()
        
        trend_data.append({
            'date': start_of_day.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Reverse to show oldest first
    trend_data.reverse()
    
    # Source distribution
    source_distribution = db.session.query(
        Vulnerability.source,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.source).all()
    
    source_data = {
        'internal': 0,
        'nvd': 0,
        'other': 0
    }
    
    for source, count in source_distribution:
        source_data[source.value] = count
    
    # Prepare response
    summary = {
        'kpis': {
            'total_vulnerabilities': total_vulns,
            'critical_vulnerabilities': critical_vulns,
            'high_vulnerabilities': high_vulns,
            'medium_vulnerabilities': medium_vulns,
            'low_vulnerabilities': low_vulns,
            'recent_vulnerabilities': recent_vulns
        },
        'charts': {
            'severity_distribution': severity_data,
            'status_distribution': status_data,
            'source_distribution': source_data,
            'trend_data': trend_data
        },
        'top_vulnerabilities': [
            {
                'id': vuln.id,
                'title': vuln.title,
                'cve_id': vuln.cve_id,
                'base_score': vuln.base_score,
                'severity': vuln.severity.value if vuln.severity else None,
                'status': vuln.status.value if vuln.status else None,
                'created_at': vuln.created_at.isoformat() if vuln.created_at else None
            }
            for vuln in top_vulns
        ]
    }
    
    return jsonify(summary)

@dashboard_bp.route('/summary-test', methods=['GET'])
def get_dashboard_summary_test():
    """Temporary endpoint without JWT authentication for testing"""
    
    # Get date range filters
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Base query with date filter
    base_query = Vulnerability.query.filter(Vulnerability.created_at >= start_date)
    
    # KPIs - Total counts
    total_vulns = Vulnerability.query.count()
    critical_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.CRITICAL).count()
    high_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.HIGH).count()
    medium_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.MEDIUM).count()
    low_vulns = Vulnerability.query.filter(Vulnerability.severity == Severity.LOW).count()
    
    # Recent vulnerabilities (last 30 days)
    recent_vulns = base_query.count()
    
    # Distribution by severity
    severity_distribution = db.session.query(
        Vulnerability.severity,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.severity).all()
    
    severity_data = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0
    }
    
    for severity, count in severity_distribution:
        severity_data[severity.value] = count
    
    # Distribution by status
    status_distribution = db.session.query(
        Vulnerability.status,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.status).all()
    
    status_data = {
        'Open': 0,
        'Mitigating': 0,
        'Fixed': 0,
        'Accepted': 0
    }
    
    for status, count in status_distribution:
        status_data[status.value] = count
    
    # Top 10 vulnerabilities by score
    top_vulns = Vulnerability.query.filter(
        Vulnerability.base_score.isnot(None)
    ).order_by(desc(Vulnerability.base_score)).limit(10).all()
    
    # Trend data - vulnerabilities created per day
    trend_data = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=i)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        count = Vulnerability.query.filter(
            Vulnerability.created_at >= start_of_day,
            Vulnerability.created_at < end_of_day
        ).count()
        
        trend_data.append({
            'date': start_of_day.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Reverse to show oldest first
    trend_data.reverse()
    
    # Source distribution
    source_distribution = db.session.query(
        Vulnerability.source,
        func.count(Vulnerability.id).label('count')
    ).group_by(Vulnerability.source).all()
    
    source_data = {
        'internal': 0,
        'nvd': 0,
        'other': 0
    }
    
    for source, count in source_distribution:
        source_data[source.value] = count
    
    # Prepare response
    summary = {
        'kpis': {
            'total_vulnerabilities': total_vulns,
            'critical_vulnerabilities': critical_vulns,
            'high_vulnerabilities': high_vulns,
            'medium_vulnerabilities': medium_vulns,
            'low_vulnerabilities': low_vulns,
            'recent_vulnerabilities': recent_vulns
        },
        'charts': {
            'severity_distribution': severity_data,
            'status_distribution': status_data,
            'source_distribution': source_data,
            'trend_data': trend_data
        },
        'top_vulnerabilities': [
            {
                'id': vuln.id,
                'title': vuln.title,
                'cve_id': vuln.cve_id,
                'base_score': vuln.base_score,
                'severity': vuln.severity.value if vuln.severity else None,
                'status': vuln.status.value if vuln.status else None,
                'created_at': vuln.created_at.isoformat() if vuln.created_at else None
            }
            for vuln in top_vulns
        ]
    }
    
    return jsonify(summary)
