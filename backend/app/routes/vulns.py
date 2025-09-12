from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.evaluation import Evaluation
from app.models.audit_log import AuditLog
from app.models.vulnerability_history import VulnerabilityHistory
from app.services.cvss_service import CVSSService
from app.utils.authorization import admin_required, analyst_required, viewer_required
from app.utils.audit_decorator import audit_log, get_vulnerability_id_from_response, get_vulnerability_name_from_request, get_vulnerability_details_from_request
from sqlalchemy import desc
import datetime
import json

vulns_bp = Blueprint('vulns', __name__)

@vulns_bp.route('', methods=['GET'])
@vulns_bp.route('/', methods=['GET'])
@jwt_required()
def get_vulnerabilities():
    """Get all vulnerabilities with filtering"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    severity = request.args.get('severity')
    status = request.args.get('status')
    source = request.args.get('source')
    search = request.args.get('search')
    
    # Build query
    query = Vulnerability.query
    
    # Apply filters
    if severity:
        query = query.filter(Vulnerability.severity == Severity(severity))
    if status:
        query = query.filter(Vulnerability.status == Status(status))
    if source:
        query = query.filter(Vulnerability.source == Source(source))
    if search:
        query = query.filter(
            db.or_(
                Vulnerability.title.ilike(f'%{search}%'),
                Vulnerability.cve_id.ilike(f'%{search}%'),
                Vulnerability.description.ilike(f'%{search}%')
            )
        )
    
    # Order by creation date (newest first)
    query = query.order_by(desc(Vulnerability.created_at))
    
    # Paginate
    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    vulnerabilities = pagination.items
    
    return jsonify({
        'vulnerabilities': [vuln.to_dict() for vuln in vulnerabilities],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200

@vulns_bp.route('/<int:vuln_id>', methods=['GET'])
@jwt_required()
def get_vulnerability(vuln_id):
    """Get a specific vulnerability"""
    vulnerability = Vulnerability.query.get_or_404(vuln_id)
    
    # Get evaluations for this vulnerability
    evaluations = vulnerability.evaluations.order_by(desc(Evaluation.created_at)).all()
    
    return jsonify({
        'vulnerability': vulnerability.to_dict(),
        'evaluations': [eval.to_dict() for eval in evaluations]
    }), 200

@vulns_bp.route('', methods=['POST'])
@vulns_bp.route('/', methods=['POST'])
@jwt_required()
@audit_log(
    action='CREATE_VULNERABILITY',
    target_type='vulnerability',
    get_target_id=get_vulnerability_id_from_response,
    get_target_name=get_vulnerability_name_from_request,
    get_details=get_vulnerability_details_from_request
)
def create_vulnerability():
    """Create a new vulnerability"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_analyst():
        return jsonify({'error': 'Analyst access required'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'severity']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Create vulnerability
        vulnerability = Vulnerability(
            title=data['title'],
            severity=Severity(data['severity']),
            owner_id=current_user_id,
            cve_id=data.get('cve_id'),
            description=data.get('description'),
            vector=data.get('vector'),
            status=Status(data.get('status', 'Open')),
            source=Source(data.get('source', 'internal'))
        )
        
        # Calculate CVSS score if vector is provided
        if vulnerability.vector:
            scores = CVSSService.calculate_all_scores(vulnerability.vector)
            vulnerability.base_score = scores['base_score']
            vulnerability.severity = Severity(scores['severity'])
        
        db.session.add(vulnerability)
        db.session.commit()
        
        # Log the creation in audit log
        audit_log = AuditLog(
            user_id=current_user_id,
            username=current_user.name,
            action='CREATE_VULNERABILITY',
            target_type='vulnerability',
            target_id=vulnerability.id,
            target_name=vulnerability.title,
            details=json.dumps({'title': vulnerability.title, 'severity': vulnerability.severity.value}),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        db.session.add(audit_log)
        
        # Log the creation in vulnerability history
        VulnerabilityHistory.log_change(
            vulnerability_id=vulnerability.id,
            user_id=current_user_id,
            username=current_user.name,
            action='CREATE',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vulnerability created successfully',
            'vulnerability': vulnerability.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vulns_bp.route('/<int:vuln_id>', methods=['PUT'])
@jwt_required()
def update_vulnerability(vuln_id):
    """Update a vulnerability"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    vulnerability = Vulnerability.query.get_or_404(vuln_id)
    
    # Check permissions
    if not current_user.is_admin() and vulnerability.owner_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    try:
        # Store old values for comparison
        old_vulnerability = Vulnerability.query.get(vuln_id)
        
        # Update fields
        if data.get('title'):
            vulnerability.title = data['title']
        if data.get('description'):
            vulnerability.description = data['description']
        if data.get('cve_id'):
            vulnerability.cve_id = data['cve_id']
        if data.get('severity'):
            vulnerability.severity = Severity(data['severity'])
        if data.get('status'):
            vulnerability.status = Status(data['status'])
        if data.get('source'):
            vulnerability.source = Source(data['source'])
        if data.get('vector'):
            vulnerability.vector = data['vector']
            # Recalculate CVSS score
            scores = CVSSService.calculate_all_scores(vulnerability.vector)
            vulnerability.base_score = scores['base_score']
            vulnerability.severity = Severity(scores['severity'])
        
        db.session.commit()
        
        # Log the update in audit log
        audit_log = AuditLog(
            user_id=current_user_id,
            username=current_user.name,
            action='UPDATE_VULNERABILITY',
            target_type='vulnerability',
            target_id=vulnerability.id,
            target_name=vulnerability.title,
            details=json.dumps({'updated_fields': list(data.keys())}),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        db.session.add(audit_log)
        
        # Log detailed changes in vulnerability history
        VulnerabilityHistory.compare_objects(
            old_vulnerability, 
            vulnerability, 
            current_user_id, 
            current_user.name, 
            'UPDATE',
            request.remote_addr,
            request.headers.get('User-Agent', '')
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vulnerability updated successfully',
            'vulnerability': vulnerability.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vulns_bp.route('/<int:vuln_id>', methods=['DELETE'])
@jwt_required()
def delete_vulnerability(vuln_id):
    """Delete a vulnerability"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    vulnerability = Vulnerability.query.get_or_404(vuln_id)
    
    # Check permissions
    if not current_user.is_admin() and vulnerability.owner_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        # Log the deletion in audit log
        audit_log = AuditLog(
            user_id=current_user_id,
            username=current_user.name,
            action='DELETE_VULNERABILITY',
            target_type='vulnerability',
            target_id=vulnerability.id,
            target_name=vulnerability.title,
            details=json.dumps({'title': vulnerability.title}),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        db.session.add(audit_log)
        
        # Log the deletion in vulnerability history
        VulnerabilityHistory.log_change(
            vulnerability_id=vulnerability.id,
            user_id=current_user_id,
            username=current_user.name,
            action='DELETE',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        db.session.delete(vulnerability)
        db.session.commit()
        
        return jsonify({'message': 'Vulnerability deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vulns_bp.route('/<int:vuln_id>/evaluate', methods=['POST'])
@jwt_required()
def create_evaluation(vuln_id):
    """Create a new evaluation for a vulnerability"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_analyst():
        return jsonify({'error': 'Analyst access required'}), 403
    
    vulnerability = Vulnerability.query.get_or_404(vuln_id)
    data = request.get_json()
    
    # Validate required fields
    if not data.get('metrics'):
        return jsonify({'error': 'Metrics are required'}), 400
    
    try:
        # Use provided scores or calculate if not provided
        if data.get('base_score') is not None:
            # Use provided scores
            base_score = data['base_score']
            temporal_score = data.get('temporal_score')
            environmental_score = data.get('environmental_score')
            vector = CVSSService.generate_vector(data['metrics'])
        else:
            # Calculate scores
            vector = CVSSService.generate_vector(data['metrics'])
            scores = CVSSService.calculate_all_scores(vector)
            base_score = scores['base_score']
            temporal_score = scores.get('temporal_score')
            environmental_score = scores.get('environmental_score')
        
        # Create evaluation
        evaluation = Evaluation(
            vuln_id=vuln_id,
            metrics=data['metrics'],
            base_score=base_score,
            temporal_score=temporal_score,
            environmental_score=environmental_score,
            author_id=current_user_id
        )
        
        db.session.add(evaluation)
        
        # Update vulnerability with new scores
        vulnerability.base_score = base_score
        vulnerability.severity = Severity(CVSSService.get_severity(base_score))
        vulnerability.vector = vector
        
        db.session.commit()
        
        # Log the evaluation
        audit_log = AuditLog(
            user_id=current_user_id,
            username=current_user.name,
            action='CREATE_EVALUATION',
            target_type='evaluation',
            target_id=evaluation.id,
            details=json.dumps({'vuln_id': vuln_id, 'base_score': base_score})
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Evaluation created successfully',
            'evaluation': evaluation.to_dict(),
            'scores': {
                'base_score': base_score,
                'temporal_score': temporal_score,
                'environmental_score': environmental_score
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@vulns_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_cvss():
    """Calculate CVSS scores from metrics or vector"""
    data = request.get_json()
    
    try:
        if data.get('vector'):
            # Calculate from vector
            scores = CVSSService.calculate_all_scores(data['vector'])
            metrics = CVSSService.parse_vector(data['vector'])
        elif data.get('metrics'):
            # Calculate from metrics
            vector = CVSSService.generate_vector(data['metrics'])
            scores = CVSSService.calculate_all_scores(vector)
            metrics = data['metrics']
        else:
            return jsonify({'error': 'Either vector or metrics are required'}), 400
        
        return jsonify({
            'vector': CVSSService.generate_vector(metrics),
            'metrics': metrics,
            'scores': scores
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

