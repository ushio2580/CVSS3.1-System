from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import re
import json
from datetime import datetime
from app import db
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from app.models.user import User
from app.models.document_analysis import DocumentAnalysis
from app.utils.audit_decorator import audit_log
from app.utils.ip_utils import get_client_ip
import PyPDF2
import docx
from docx import Document
import tempfile

document_analyzer_bp = Blueprint('document_analyzer', __name__)

# Configuración de archivos permitidos
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extrae texto de un archivo PDF"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error al extraer texto del PDF: {str(e)}")

def extract_text_from_docx(file_path):
    """Extrae texto de un archivo Word"""
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error al extraer texto del Word: {str(e)}")

def analyze_vulnerability_text(text):
    """Analiza el texto para detectar vulnerabilidades y generar evaluación CVSS"""
    
    # Patrones para detectar vulnerabilidades comunes
    vulnerability_patterns = {
        'sql_injection': [
            r'sql\s+injection', r'sqli', r'blind\s+sql', r'union\s+select',
            r'drop\s+table', r'delete\s+from', r'insert\s+into'
        ],
        'xss': [
            r'cross\s+site\s+scripting', r'xss', r'<script>', r'javascript:',
            r'document\.cookie', r'alert\s*\(', r'eval\s*\('
        ],
        'csrf': [
            r'cross\s+site\s+request\s+forgery', r'csrf', r'state\s+parameter',
            r'referer\s+check', r'token\s+validation'
        ],
        'authentication': [
            r'authentication\s+bypass', r'weak\s+password', r'brute\s+force',
            r'session\s+fixation', r'credential\s+stuffing'
        ],
        'authorization': [
            r'privilege\s+escalation', r'access\s+control', r'authorization\s+bypass',
            r'horizontal\s+privilege', r'vertical\s+privilege'
        ],
        'injection': [
            r'command\s+injection', r'ldap\s+injection', r'xpath\s+injection',
            r'no-sql\s+injection', r'code\s+injection'
        ],
        'crypto': [
            r'weak\s+encryption', r'broken\s+crypto', r'hardcoded\s+key',
            r'weak\s+random', r'crypto\s+flaw'
        ],
        'network': [
            r'man\s+in\s+the\s+middle', r'mitm', r'ssl\s+strip', r'dns\s+poisoning',
            r'arp\s+spoofing', r'network\s+sniffing'
        ]
    }
    
    # Patrones para detectar severidad
    severity_patterns = {
        'critical': [r'critical', r'severe', r'high\s+risk', r'urgent', r'exploit'],
        'high': [r'high', r'significant', r'major', r'important'],
        'medium': [r'medium', r'moderate', r'medium\s+risk'],
        'low': [r'low', r'minor', r'informational', r'info']
    }
    
    # Patrones para detectar componentes CVSS
    cvss_patterns = {
        'attack_vector': {
            'network': [r'network', r'remote', r'internet', r'web'],
            'adjacent': [r'adjacent', r'local\s+network', r'same\s+network'],
            'local': [r'local', r'physical', r'console', r'keyboard'],
            'physical': [r'physical', r'hardware', r'device']
        },
        'attack_complexity': {
            'low': [r'simple', r'easy', r'straightforward', r'low\s+complexity'],
            'high': [r'complex', r'difficult', r'advanced', r'high\s+complexity']
        },
        'privileges_required': {
            'none': [r'no\s+privileges', r'unprivileged', r'guest', r'anonymous'],
            'low': [r'low\s+privileges', r'user', r'basic'],
            'high': [r'high\s+privileges', r'admin', r'root', r'elevated']
        },
        'user_interaction': {
            'none': [r'no\s+interaction', r'automatic', r'background'],
            'required': [r'user\s+interaction', r'click', r'visit', r'action']
        },
        'scope': {
            'unchanged': [r'same\s+scope', r'local\s+impact', r'no\s+scope\s+change'],
            'changed': [r'different\s+scope', r'cross\s+scope', r'scope\s+change']
        },
        'confidentiality': {
            'none': [r'no\s+data\s+exposure', r'no\s+confidentiality\s+impact'],
            'low': [r'limited\s+data', r'some\s+information', r'partial\s+exposure'],
            'high': [r'sensitive\s+data', r'complete\s+exposure', r'all\s+data']
        },
        'integrity': {
            'none': [r'no\s+data\s+modification', r'no\s+integrity\s+impact'],
            'low': [r'limited\s+modification', r'some\s+data\s+change'],
            'high': [r'complete\s+modification', r'all\s+data\s+change']
        },
        'availability': {
            'none': [r'no\s+service\s+disruption', r'no\s+availability\s+impact'],
            'low': [r'limited\s+disruption', r'some\s+service\s+impact'],
            'high': [r'complete\s+disruption', r'service\s+down', r'system\s+crash']
        }
    }
    
    detected_vulnerabilities = []
    text_lower = text.lower()
    
    # Detectar tipos de vulnerabilidades
    for vuln_type, patterns in vulnerability_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                detected_vulnerabilities.append(vuln_type)
                break
    
    # Detectar severidad
    detected_severity = 'medium'  # default
    for severity, patterns in severity_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                detected_severity = severity
                break
    
    # Detectar componentes CVSS
    cvss_components = {}
    for component, values in cvss_patterns.items():
        for value, patterns in values.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    cvss_components[component] = value
                    break
    
    # Valores por defecto para componentes no detectados
    default_cvss = {
        'attack_vector': 'network',
        'attack_complexity': 'low',
        'privileges_required': 'none',
        'user_interaction': 'none',
        'scope': 'unchanged',
        'confidentiality': 'high',
        'integrity': 'high',
        'availability': 'high'
    }
    
    for component, default_value in default_cvss.items():
        if component not in cvss_components:
            cvss_components[component] = default_value
    
    # Debug: Log what was detected
    current_app.logger.info(f"Detected vulnerabilities: {detected_vulnerabilities}")
    current_app.logger.info(f"Detected severity: {detected_severity}")
    
    return {
        'vulnerability_types': detected_vulnerabilities,
        'severity': detected_severity,
        'cvss_components': cvss_components
    }

def calculate_cvss_score(cvss_components):
    """Calcula el score CVSS basado en los componentes detectados"""
    
    # Mapeo de valores a números
    attack_vector_map = {'network': 0.85, 'adjacent': 0.62, 'local': 0.55, 'physical': 0.2}
    attack_complexity_map = {'low': 0.77, 'high': 0.44}
    privileges_required_map = {'none': 0.85, 'low': 0.62, 'high': 0.27}
    user_interaction_map = {'none': 0.85, 'required': 0.62}
    scope_map = {'unchanged': 1, 'changed': 1.08}
    cia_map = {'none': 0, 'low': 0.22, 'high': 0.56}
    
    # Calcular Impact
    impact = 1 - ((1 - cia_map[cvss_components['confidentiality']]) * 
                  (1 - cia_map[cvss_components['integrity']]) * 
                  (1 - cia_map[cvss_components['availability']]))
    
    if cvss_components['scope'] == 'changed':
        impact = 7.52 * (impact - 0.029) - 3.25 * ((impact - 0.02) ** 15)
    else:
        impact = 6.42 * impact
    
    # Calcular Exploitability
    exploitability = 8.22 * attack_vector_map[cvss_components['attack_vector']] * \
                    attack_complexity_map[cvss_components['attack_complexity']] * \
                    privileges_required_map[cvss_components['privileges_required']] * \
                    user_interaction_map[cvss_components['user_interaction']]
    
    # Calcular score base
    if impact <= 0:
        base_score = 0
    elif cvss_components['scope'] == 'changed':
        base_score = 1.08 * (impact + exploitability)
    else:
        base_score = impact + exploitability
    
    # Redondear a 1 decimal
    base_score = round(min(10.0, base_score), 1)
    
    return base_score

@document_analyzer_bp.route('/analyze', methods=['POST'])
@audit_log('document_analysis')
def analyze_document():
    """Analiza un documento (PDF o Word) para detectar vulnerabilidades"""
    try:
        # Verificar que se subió un archivo
        if 'file' not in request.files:
            return jsonify({'error': 'No se subió ningún archivo'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo de archivo no permitido. Solo se permiten PDF, DOC y DOCX'}), 400
        
        # Verificar tamaño del archivo
        file.seek(0, 2)  # Ir al final del archivo
        file_size = file.tell()
        file.seek(0)  # Volver al inicio
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': f'El archivo es demasiado grande. Máximo {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        # Crear archivo temporal
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            # Extraer texto según el tipo de archivo
            if filename.lower().endswith('.pdf'):
                text = extract_text_from_pdf(temp_path)
            elif filename.lower().endswith(('.docx', '.doc')):
                text = extract_text_from_docx(temp_path)
            else:
                return jsonify({'error': 'Tipo de archivo no soportado'}), 400
            
            if not text.strip():
                return jsonify({'error': 'No se pudo extraer texto del documento'}), 400
            
            # Analizar el texto
            analysis = analyze_vulnerability_text(text)
            
            # Calcular score CVSS
            cvss_score = calculate_cvss_score(analysis['cvss_components'])
            
            # Determinar severidad basada en el score
            if cvss_score >= 9.0:
                severity = 'critical'
            elif cvss_score >= 7.0:
                severity = 'high'
            elif cvss_score >= 4.0:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Generar recomendaciones
            recommendations = generate_recommendations(analysis['vulnerability_types'], cvss_score)
            
            # Crear resultado
            result = {
                'filename': filename,
                'file_size': file_size,
                'text_length': len(text),
                'analysis': analysis,
                'cvss_score': cvss_score,
                'severity': severity,
                'recommendations': recommendations,
                'extracted_text_preview': text[:500] + '...' if len(text) > 500 else text
            }
            
            # Guardar análisis en la base de datos
            try:
                # Obtener el usuario actual (asumiendo que hay autenticación)
                # Por ahora usaremos un usuario por defecto, pero esto debería venir del token JWT
                user_id = 1  # TODO: Obtener del token JWT cuando esté implementado
                
                # Determinar el tipo de archivo
                file_type = filename.lower().split('.')[-1]
                
                # Crear registro en la base de datos
                document_analysis = DocumentAnalysis(
                    user_id=user_id,
                    filename=filename,
                    file_size=file_size,
                    file_type=file_type,
                    extracted_text=text,  # Guardar texto completo
                    extracted_text_preview=text[:500] + '...' if len(text) > 500 else text,
                    vulnerability_types=analysis['vulnerability_types'],
                    cvss_score=cvss_score,
                    severity=severity,
                    cvss_components=analysis['cvss_components'],
                    recommendations=recommendations
                )
                
                db.session.add(document_analysis)
                db.session.commit()
                
                # Agregar el ID del análisis al resultado
                result['analysis_id'] = document_analysis.id
                
            except Exception as db_error:
                # Si hay error al guardar en la base de datos, continuar con el análisis
                current_app.logger.error(f"Error saving analysis to database: {str(db_error)}")
                result['db_save_error'] = 'Analysis completed but could not be saved to database'
            
            return jsonify({
                'success': True,
                'result': result,
                'message': 'Document analyzed successfully'
            }), 200
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
                
    except Exception as e:
        return jsonify({'error': f'Error al analizar el documento: {str(e)}'}), 500

def generate_recommendations(vulnerability_types, cvss_score):
    """Genera recomendaciones basadas en las vulnerabilidades detectadas"""
    recommendations = []
    
    if 'sql_injection' in vulnerability_types:
        recommendations.append("Implement prepared statements and input validation")
    
    if 'xss' in vulnerability_types:
        recommendations.append("Implement input sanitization and Content Security Policy")
    
    if 'csrf' in vulnerability_types:
        recommendations.append("Implement CSRF tokens and referer validation")
    
    if 'authentication' in vulnerability_types:
        recommendations.append("Implement multi-factor authentication and password policies")
    
    if 'authorization' in vulnerability_types:
        recommendations.append("Implement role-based access control (RBAC)")
    
    if 'injection' in vulnerability_types:
        recommendations.append("Implement input validation and sanitization")
    
    if 'crypto' in vulnerability_types:
        recommendations.append("Use secure encryption algorithms and proper key management")
    
    if 'network' in vulnerability_types:
        recommendations.append("Implement HTTPS, SSL certificates and MITM protection")
    
    if cvss_score >= 9.0:
        recommendations.append("URGENT: This vulnerability requires immediate attention")
    elif cvss_score >= 7.0:
        recommendations.append("HIGH PRIORITY: This vulnerability should be fixed soon")
    elif cvss_score >= 4.0:
        recommendations.append("MEDIUM PRIORITY: This vulnerability should be fixed in the next cycle")
    else:
        recommendations.append("LOW PRIORITY: This vulnerability can be fixed when convenient")
    
    return recommendations

@document_analyzer_bp.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """Retorna los formatos de archivo soportados"""
    return jsonify({
        'supported_formats': list(ALLOWED_EXTENSIONS),
        'max_file_size_mb': MAX_FILE_SIZE // (1024 * 1024),
        'description': 'Supported formats for vulnerability analysis'
    }), 200

@document_analyzer_bp.route('/history', methods=['GET'])
@audit_log('document_analysis_history')
def get_analysis_history():
    """Obtiene el historial de análisis de documentos"""
    try:
        # Por ahora obtenemos todos los análisis, pero esto debería filtrarse por usuario
        # TODO: Implementar autenticación JWT y filtrar por usuario
        analyses = DocumentAnalysis.query.order_by(DocumentAnalysis.created_at.desc()).limit(50).all()
        
        return jsonify({
            'success': True,
            'analyses': [analysis.to_dict() for analysis in analyses],
            'total': len(analyses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error retrieving analysis history: {str(e)}'}), 500

@document_analyzer_bp.route('/history/<int:analysis_id>', methods=['GET'])
@audit_log('document_analysis_detail')
def get_analysis_detail(analysis_id):
    """Obtiene los detalles de un análisis específico"""
    try:
        analysis = DocumentAnalysis.query.get_or_404(analysis_id)
        
        return jsonify({
            'success': True,
            'analysis': analysis.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error retrieving analysis details: {str(e)}'}), 500
