from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.user import User
from app.services.cvss_service import CVSSService
from app.utils.authorization import analyst_required
import csv
import json
import io
from datetime import datetime
from sqlalchemy.exc import IntegrityError

bulk_bp = Blueprint('bulk', __name__)

@bulk_bp.route('/upload', methods=['POST'])
@jwt_required()
@analyst_required
def bulk_upload():
    """Upload multiple vulnerabilities from CSV or JSON file"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file type
    if not file.filename.lower().endswith(('.csv', '.json')):
        return jsonify({'error': 'Only CSV and JSON files are supported'}), 400
    
    try:
        vulnerabilities_data = []
        
        if file.filename.lower().endswith('.csv'):
            # Parse CSV
            content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(content))
            vulnerabilities_data = list(csv_reader)
        else:
            # Parse JSON
            content = file.read().decode('utf-8')
            json_data = json.loads(content)
            
            # Handle different JSON formats
            if isinstance(json_data, list):
                # Simple array format: [{"title": "...", ...}, ...]
                vulnerabilities_data = json_data
            elif isinstance(json_data, dict) and 'vulnerabilities' in json_data:
                # Detailed format with metadata: {"metadata": {...}, "vulnerabilities": [...]}
                vulnerabilities_data = json_data['vulnerabilities']
            else:
                return jsonify({'error': 'Invalid JSON format. Expected array or object with "vulnerabilities" key'}), 400
        
        if not vulnerabilities_data:
            return jsonify({'error': 'No data found in file'}), 400
        
        # Process vulnerabilities
        results = {
            'total': len(vulnerabilities_data),
            'created': 0,
            'skipped': 0,
            'errors': []
        }
        
        for i, vuln_data in enumerate(vulnerabilities_data, 1):
            try:
                # Validate required fields
                if not vuln_data.get('title'):
                    results['errors'].append(f"Row {i}: Missing title")
                    results['skipped'] += 1
                    continue
                
                # Create vulnerability
                vulnerability = Vulnerability(
                    title=vuln_data.get('title', '').strip(),
                    cve_id=vuln_data.get('cve_id', '').strip() or None,
                    description=vuln_data.get('description', '').strip() or None,
                    vector=vuln_data.get('vector', '').strip() or None,
                    severity=Severity(vuln_data.get('severity', 'Medium')),
                    status=Status(vuln_data.get('status', 'Open')),
                    source=Source(vuln_data.get('source', 'internal')),
                    owner_id=current_user_id
                )
                
                # Calculate CVSS score if vector is provided
                if vulnerability.vector:
                    try:
                        scores = CVSSService.calculate_all_scores(vulnerability.vector)
                        vulnerability.base_score = scores['base_score']
                        vulnerability.severity = Severity(scores['severity'])
                    except Exception as e:
                        results['errors'].append(f"Row {i}: Invalid CVSS vector - {str(e)}")
                        # Continue without CVSS calculation
                
                db.session.add(vulnerability)
                results['created'] += 1
                
            except IntegrityError as e:
                db.session.rollback()
                if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e).lower():
                    results['errors'].append(f"Row {i}: Duplicate CVE ID '{vuln_data.get('cve_id', 'N/A')}'")
                else:
                    results['errors'].append(f"Row {i}: Database integrity error - {str(e)}")
                results['skipped'] += 1
            except ValueError as e:
                db.session.rollback()
                results['errors'].append(f"Row {i}: Invalid data format - {str(e)}")
                results['skipped'] += 1
            except Exception as e:
                db.session.rollback()
                results['errors'].append(f"Row {i}: Unexpected error - {str(e)}")
                results['skipped'] += 1
        
        # Commit all successful creations
        db.session.commit()
        
        return jsonify({
            'message': 'Bulk upload completed',
            'results': results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'File processing error: {str(e)}'}), 500

@bulk_bp.route('/template', methods=['GET'])
@jwt_required()
def download_template():
    """Download CSV template for bulk upload"""
    from flask import send_file
    
    # Create CSV template
    template_data = [
        {
            'title': 'SQL Injection in Login Form',
            'cve_id': 'CVE-2024-0001',
            'description': 'Critical SQL injection vulnerability in login form',
            'vector': 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
            'severity': 'Critical',
            'status': 'Open',
            'source': 'internal'
        },
        {
            'title': 'Cross-Site Scripting (XSS)',
            'cve_id': 'CVE-2024-0002',
            'description': 'XSS vulnerability in search functionality',
            'vector': 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
            'severity': 'High',
            'status': 'Open',
            'source': 'nvd'
        },
        {
            'title': 'Weak Password Policy',
            'cve_id': 'CVE-2024-0003',
            'description': 'Weak password requirements',
            'vector': 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:L',
            'severity': 'Medium',
            'status': 'Open',
            'source': 'internal'
        }
    ]
    
    # Create CSV buffer
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=template_data[0].keys())
    writer.writeheader()
    writer.writerows(template_data)
    
    output.seek(0)
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'vulnerability_template_{datetime.now().strftime("%Y%m%d")}.csv'
    )

@bulk_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_file():
    """Validate file before upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        vulnerabilities_data = []
        
        if file.filename.lower().endswith('.csv'):
            content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(content))
            vulnerabilities_data = list(csv_reader)
        else:
            content = file.read().decode('utf-8')
            json_data = json.loads(content)
            
            # Handle different JSON formats
            if isinstance(json_data, list):
                # Simple array format: [{"title": "...", ...}, ...]
                vulnerabilities_data = json_data
            elif isinstance(json_data, dict) and 'vulnerabilities' in json_data:
                # Detailed format with metadata: {"metadata": {...}, "vulnerabilities": [...]}
                vulnerabilities_data = json_data['vulnerabilities']
            else:
                return jsonify({'error': 'Invalid JSON format. Expected array or object with "vulnerabilities" key'}), 400
        
        validation_results = {
            'total_rows': len(vulnerabilities_data),
            'valid_rows': 0,
            'invalid_rows': 0,
            'errors': []
        }
        
        for i, vuln_data in enumerate(vulnerabilities_data, 1):
            row_errors = []
            
            # Check required fields
            if not vuln_data.get('title'):
                row_errors.append('Missing title')
            
            # Validate severity
            if vuln_data.get('severity') and vuln_data['severity'] not in ['Critical', 'High', 'Medium', 'Low']:
                row_errors.append('Invalid severity')
            
            # Validate status
            if vuln_data.get('status') and vuln_data['status'] not in ['Open', 'Mitigating', 'Fixed', 'Accepted']:
                row_errors.append('Invalid status')
            
            # Validate source
            if vuln_data.get('source') and vuln_data['source'] not in ['internal', 'nvd', 'external']:
                row_errors.append('Invalid source')
            
            # Validate CVSS vector
            if vuln_data.get('vector'):
                try:
                    CVSSService.parse_vector(vuln_data['vector'])
                except Exception as e:
                    row_errors.append(f'Invalid CVSS vector: {str(e)}')
            
            if row_errors:
                validation_results['invalid_rows'] += 1
                validation_results['errors'].append(f"Row {i}: {', '.join(row_errors)}")
            else:
                validation_results['valid_rows'] += 1
        
        return jsonify({
            'message': 'File validation completed',
            'validation': validation_results
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'File validation error: {str(e)}'}), 500
