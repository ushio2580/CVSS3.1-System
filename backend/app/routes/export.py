from flask import Blueprint, request, jsonify, send_file, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.evaluation import Evaluation
from app.models.user import User
from app.utils.authorization import viewer_required
from app.services.chart_service import ChartService
from app.services.report_generator import ProfessionalReportGenerator
from sqlalchemy import desc
import csv
import io
import json
import base64
from datetime import datetime

export_bp = Blueprint('export', __name__)

@export_bp.route('/csv', methods=['OPTIONS'])
@export_bp.route('/pdf', methods=['OPTIONS'])
def handle_options():
    """Handle CORS preflight requests"""
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

def _calculate_kpis(vulnerabilities):
    """Calculate KPIs for the report"""
    total = len(vulnerabilities)
    critical = sum(1 for v in vulnerabilities if v.severity == Severity.CRITICAL)
    high = sum(1 for v in vulnerabilities if v.severity == Severity.HIGH)
    medium = sum(1 for v in vulnerabilities if v.severity == Severity.MEDIUM)
    low = sum(1 for v in vulnerabilities if v.severity == Severity.LOW)
    
    return {
        'total_vulnerabilities': total,
        'critical_vulnerabilities': critical,
        'high_vulnerabilities': high,
        'medium_vulnerabilities': medium,
        'low_vulnerabilities': low
    }

def _generate_charts_data(vulnerabilities):
    """Generate charts data for the report"""
    charts_data = {}
    
    # Severity distribution
    severity_counts = {}
    for vuln in vulnerabilities:
        severity = vuln.severity.value if vuln.severity else 'Unknown'
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
    
    charts_data['severity_distribution'] = severity_counts
    
    # Trend data (last 7 days)
    from datetime import timedelta
    trend_data = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        count = sum(1 for v in vulnerabilities if v.created_at and v.created_at.date() == date.date())
        trend_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    charts_data['trend_data'] = list(reversed(trend_data))
    
    return charts_data

@export_bp.route('/csv', methods=['GET'])
@jwt_required()
@viewer_required
def export_csv():
    """Export vulnerabilities to professional CSV report"""
    
    # Get filters
    severity = request.args.get('severity')
    status = request.args.get('status')
    source = request.args.get('source')
    include_evaluations = request.args.get('include_evaluations', 'false').lower() == 'true'
    
    # Build query
    query = Vulnerability.query
    
    if severity:
        query = query.filter(Vulnerability.severity == Severity(severity))
    if status:
        query = query.filter(Vulnerability.status == Status(status))
    if source:
        query = query.filter(Vulnerability.source == Source(source))
    
    vulnerabilities = query.order_by(desc(Vulnerability.created_at)).all()
    
    # Prepare data for professional report
    report_data = {
        'vulnerabilities': [vuln.to_dict() for vuln in vulnerabilities],
        'kpis': _calculate_kpis(vulnerabilities),
        'report_type': 'vulnerability'
    }
    
    # Generate professional CSV report
    report_generator = ProfessionalReportGenerator()
    csv_content = report_generator.generate_professional_csv_report(report_data, 'vulnerability')
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'CVSS_Vulnerability_Report_{timestamp}.csv'
    
    response = make_response(csv_content)
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    return response

@export_bp.route('/pdf', methods=['GET'])
@jwt_required()
@viewer_required
def export_pdf():
    """Export vulnerabilities to professional PDF report"""
    
    # Get filters
    severity = request.args.get('severity')
    status = request.args.get('status')
    source = request.args.get('source')
    
    # Build query
    query = Vulnerability.query
    
    if severity:
        query = query.filter(Vulnerability.severity == Severity(severity))
    if status:
        query = query.filter(Vulnerability.status == Status(status))
    if source:
        query = query.filter(Vulnerability.source == Source(source))
    
    vulnerabilities = query.order_by(desc(Vulnerability.base_score)).all()
    
    # Prepare data for professional report
    report_data = {
        'vulnerabilities': [vuln.to_dict() for vuln in vulnerabilities],
        'kpis': _calculate_kpis(vulnerabilities),
        'top_vulnerabilities': [vuln.to_dict() for vuln in vulnerabilities[:10]],
        'charts': _generate_charts_data(vulnerabilities),
        'report_type': 'vulnerability'
    }
    
    # Generate professional PDF report
    report_generator = ProfessionalReportGenerator()
    pdf_content = report_generator.generate_professional_pdf_report(report_data, 'vulnerability')
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'CVSS_Vulnerability_Report_{timestamp}.pdf'
    
    response = make_response(pdf_content)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    return response

@export_bp.route('/evaluations/csv', methods=['GET'])
@jwt_required()
@viewer_required
def export_evaluations_csv():
    """Export evaluations to CSV"""
    
    vuln_id = request.args.get('vuln_id', type=int)
    
    # Build query
    query = Evaluation.query
    
    if vuln_id:
        query = query.filter(Evaluation.vuln_id == vuln_id)
    
    evaluations = query.order_by(desc(Evaluation.created_at)).all()
    
    # Create CSV buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Vulnerability ID', 'Vulnerability Title', 'Base Score',
        'Temporal Score', 'Environmental Score', 'Author', 'Created At'
    ])
    
    # Write data
    for eval in evaluations:
        writer.writerow([
            eval.id,
            eval.vuln_id,
            eval.vulnerability.title if eval.vulnerability else '',
            eval.base_score,
            eval.temporal_score or '',
            eval.environmental_score or '',
            eval.author.name if eval.author else '',
            eval.created_at.strftime('%Y-%m-%d %H:%M:%S') if eval.created_at else ''
        ])
    
    # Create response
    output.seek(0)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'evaluations_{timestamp}.csv'
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

@export_bp.route('/audit/csv', methods=['GET'])
@jwt_required()
@viewer_required
def export_audit_csv():
    """Export audit logs to CSV"""
    
    from app.models.audit_log import AuditLog
    
    # Get filters
    action_type = request.args.get('action_type')
    target = request.args.get('target')
    username = request.args.get('username')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = AuditLog.query
    
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if target:
        query = query.filter(AuditLog.target.contains(target))
    if username:
        query = query.filter(AuditLog.username.contains(username))
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    logs = query.order_by(desc(AuditLog.timestamp)).all()
    
    # Create CSV buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'User ID', 'Username', 'Action Type', 'Target', 'IP Address',
        'User Agent', 'Success', 'Timestamp'
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log.id,
            log.user_id,
            log.username,
            log.action_type,
            log.target,
            log.ip_address,
            log.user_agent,
            log.success,
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else ''
        ])
    
    # Create response
    output.seek(0)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'audit_logs_{timestamp}.csv'
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

@export_bp.route('/audit/pdf', methods=['GET'])
@jwt_required()
@viewer_required
def export_audit_pdf():
    """Export audit logs to professional PDF report"""
    
    from app.models.audit_log import AuditLog
    
    # Get filters
    action_type = request.args.get('action_type')
    target = request.args.get('target')
    username = request.args.get('username')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = AuditLog.query
    
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if target:
        query = query.filter(AuditLog.target.contains(target))
    if username:
        query = query.filter(AuditLog.username.contains(username))
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    logs = query.order_by(desc(AuditLog.timestamp)).all()
    
    # Prepare data for professional report
    report_data = {
        'logs': [log.to_dict() for log in logs],
        'kpis': {
            'total_logs': len(logs),
            'successful_actions': sum(1 for log in logs if log.success),
            'failed_actions': sum(1 for log in logs if not log.success),
            'unique_users': len(set(log.user_id for log in logs))
        },
        'report_type': 'audit'
    }
    
    # Generate professional PDF report
    report_generator = ProfessionalReportGenerator()
    pdf_content = report_generator.generate_professional_pdf_report(report_data, 'audit')
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'CVSS_Audit_Report_{timestamp}.pdf'
    
    return send_file(
        io.BytesIO(pdf_content),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
