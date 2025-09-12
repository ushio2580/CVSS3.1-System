from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.authorization import admin_required, analyst_required
from sqlalchemy import desc, and_, or_
from datetime import datetime, timedelta
import json

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_logs():
    """Get audit logs with filtering and pagination"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    action = request.args.get('action')
    target_type = request.args.get('target_type')
    username = request.args.get('username')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    success = request.args.get('success')
    
    # Build query
    query = AuditLog.query
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    
    if username:
        query = query.filter(AuditLog.username.ilike(f'%{username}%'))
    
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp >= start_datetime)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp <= end_datetime)
        except ValueError:
            pass
    
    if success is not None:
        success_bool = success.lower() == 'true'
        query = query.filter(AuditLog.success == success_bool)
    
    # Order by timestamp (newest first)
    query = query.order_by(desc(AuditLog.timestamp))
    
    # Paginate
    pagination = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    logs = [log.to_dict() for log in pagination.items]
    
    return jsonify({
        'logs': logs,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200

@audit_bp.route('/logs/summary', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_summary():
    """Get audit logs summary statistics"""
    current_user_id = get_jwt_identity()
    
    # Get date range (default: last 30 days)
    days = request.args.get('days', 30, type=int)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get logs in date range
    logs = AuditLog.query.filter(
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    ).all()
    
    # Calculate statistics
    total_actions = len(logs)
    successful_actions = len([log for log in logs if log.success])
    failed_actions = total_actions - successful_actions
    
    # Actions by type
    actions_count = {}
    target_types_count = {}
    users_count = {}
    
    for log in logs:
        # Count actions
        actions_count[log.action] = actions_count.get(log.action, 0) + 1
        
        # Count target types
        target_types_count[log.target_type] = target_types_count.get(log.target_type, 0) + 1
        
        # Count users
        users_count[log.username] = users_count.get(log.username, 0) + 1
    
    # Get top actions
    top_actions = sorted(actions_count.items(), key=lambda x: x[1], reverse=True)[:10]
    top_target_types = sorted(target_types_count.items(), key=lambda x: x[1], reverse=True)[:10]
    top_users = sorted(users_count.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return jsonify({
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': days
        },
        'statistics': {
            'total_actions': total_actions,
            'successful_actions': successful_actions,
            'failed_actions': failed_actions,
            'success_rate': (successful_actions / total_actions * 100) if total_actions > 0 else 0
        },
        'top_actions': [{'action': action, 'count': count} for action, count in top_actions],
        'top_target_types': [{'type': target_type, 'count': count} for target_type, count in top_target_types],
        'top_users': [{'username': username, 'count': count} for username, count in top_users]
    }), 200

@audit_bp.route('/logs/<int:log_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_log(log_id):
    """Get specific audit log by ID"""
    current_user_id = get_jwt_identity()
    
    log = AuditLog.query.get_or_404(log_id)
    
    return jsonify(log.to_dict()), 200

@audit_bp.route('/logs/export', methods=['GET'])
@jwt_required()
@admin_required
def export_audit_logs():
    """Export audit logs to CSV"""
    from io import StringIO
    import csv
    
    current_user_id = get_jwt_identity()
    
    # Get query parameters (same as get_audit_logs)
    action = request.args.get('action')
    target_type = request.args.get('target_type')
    username = request.args.get('username')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    success = request.args.get('success')
    
    # Build query
    query = AuditLog.query
    
    # Apply filters (same as get_audit_logs)
    if action:
        query = query.filter(AuditLog.action == action)
    
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    
    if username:
        query = query.filter(AuditLog.username.ilike(f'%{username}%'))
    
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp >= start_datetime)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.timestamp <= end_datetime)
        except ValueError:
            pass
    
    if success is not None:
        success_bool = success.lower() == 'true'
        query = query.filter(AuditLog.success == success_bool)
    
    # Order by timestamp (newest first)
    logs = query.order_by(desc(AuditLog.timestamp)).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Timestamp', 'Username', 'Action', 'Target Type', 
        'Target ID', 'Target Name', 'IP Address', 'Success', 'Error Message'
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat() if log.timestamp else '',
            log.username,
            log.action,
            log.target_type,
            log.target_id,
            log.target_name,
            log.ip_address,
            'Yes' if log.success else 'No',
            log.error_message or ''
        ])
    
    output.seek(0)
    
    from flask import Response
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=audit_logs.csv'}
    )

@audit_bp.route('/logs/actions', methods=['GET'])
@jwt_required()
@admin_required
def get_available_actions():
    """Get list of available actions for filtering"""
    current_user_id = get_jwt_identity()
    
    actions = db.session.query(AuditLog.action).distinct().all()
    target_types = db.session.query(AuditLog.target_type).distinct().all()
    usernames = db.session.query(AuditLog.username).distinct().all()
    
    return jsonify({
        'actions': [action[0] for action in actions],
        'target_types': [target_type[0] for target_type in target_types],
        'usernames': [username[0] for username in usernames]
    }), 200
