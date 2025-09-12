from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User, UserRole
from app.models.database_info import DatabaseQuery
from app.services.database_manager import DatabaseManagerService
from app import db
import json
import os
from datetime import datetime
import subprocess
from io import BytesIO
import zipfile

database_bp = Blueprint('database', __name__)

def admin_required(f):
    """Decorator para requerir rol de administrador"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or current_user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@database_bp.route('/info', methods=['GET'])
@jwt_required()
@admin_required
def get_database_info():
    """Obtener información general de la base de datos"""
    try:
        info = DatabaseManagerService.get_database_info()
        return jsonify(info), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/tables/<table_name>/structure', methods=['GET'])
@jwt_required()
@admin_required
def get_table_structure(table_name):
    """Obtener estructura de una tabla específica"""
    try:
        structure = DatabaseManagerService.get_table_structure(table_name)
        return jsonify(structure), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/tables/<table_name>/data', methods=['GET'])
@jwt_required()
@admin_required
def get_table_data(table_name):
    """Obtener datos de una tabla con paginación"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        data = DatabaseManagerService.get_table_data(table_name, limit, offset)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/tables/<table_name>/count', methods=['GET'])
@jwt_required()
@admin_required
def get_table_count(table_name):
    """Obtener el número total de filas en una tabla"""
    try:
        count = DatabaseManagerService.get_table_count(table_name)
        return jsonify(count), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/execute', methods=['POST'])
@jwt_required()
@admin_required
def execute_query():
    """Ejecutar una consulta SQL personalizada"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        data = request.get_json()
        query_text = data.get('query')
        query_type = data.get('type', 'SELECT')
        
        if not query_text:
            return jsonify({'error': 'Query text is required'}), 400
        
        # Ejecutar la consulta
        success, result, execution_time = DatabaseManagerService.execute_query(query_text, query_type)
        
        # Registrar la consulta en el historial
        db_query = DatabaseQuery(
            user_id=current_user_id,
            username=current_user.name,
            query_type=query_type.upper(),
            query_text=query_text,
            execution_time=execution_time,
            success=success,
            error_message=result.get('error') if not success else None,
            ip_address=request.remote_addr
        )
        db.session.add(db_query)
        db.session.commit()
        
        if success:
            return jsonify({
                'success': True,
                'result': result,
                'execution_time': execution_time,
                'query_id': db_query.id
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'execution_time': execution_time,
                'query_id': db_query.id
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/suggestions', methods=['GET'])
@jwt_required()
@admin_required
def get_query_suggestions():
    """Obtener sugerencias de consultas comunes"""
    try:
        suggestions = DatabaseManagerService.get_query_suggestions()
        return jsonify({'suggestions': suggestions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/queries', methods=['GET'])
@jwt_required()
@admin_required
def get_query_history():
    """Obtener historial de consultas ejecutadas"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        queries = DatabaseQuery.query.order_by(DatabaseQuery.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'queries': [query.to_dict() for query in queries.items],
            'pagination': {
                'page': queries.page,
                'per_page': queries.per_page,
                'total': queries.total,
                'pages': queries.pages,
                'has_next': queries.has_next,
                'has_prev': queries.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/queries/<int:query_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_query_details(query_id):
    """Obtener detalles de una consulta específica"""
    try:
        query = DatabaseQuery.query.get_or_404(query_id)
        return jsonify(query.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/export/<table_name>', methods=['GET'])
@jwt_required()
@admin_required
def export_table_data(table_name):
    """Exportar datos de una tabla a CSV"""
    try:
        import csv
        from io import StringIO
        
        # Obtener datos de la tabla
        data = DatabaseManagerService.get_table_data(table_name, limit=10000, offset=0)
        
        if 'error' in data:
            return jsonify(data), 400
        
        # Crear CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Escribir headers
        if data.get('columns'):
            writer.writerow(data['columns'])
        
        # Escribir datos
        for row in data.get('data', []):
            writer.writerow([row.get(col, '') for col in data['columns']])
        
        output.seek(0)
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={table_name}_export.csv'}
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/backup', methods=['POST'])
@jwt_required()
@admin_required
def create_database_backup():
    """Crear un backup completo de la base de datos PostgreSQL"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Verificar si estamos en PostgreSQL
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return jsonify({'error': 'Backup only available for PostgreSQL databases'}), 400
        
        # Crear nombre del archivo de backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"cvss_backup_{timestamp}.sql"
        
        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as temp_file:
            temp_path = temp_file.name
        
        try:
            # Ejecutar pg_dump
            result = subprocess.run([
                'pg_dump',
                '--clean',
                '--if-exists',
                '--no-owner',
                '--no-privileges',
                '--verbose',
                database_url,
                '-f', temp_path
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                return jsonify({
                    'error': 'Failed to create backup',
                    'details': result.stderr
                }), 500
            
            # Leer el archivo de backup
            with open(temp_path, 'r') as f:
                backup_content = f.read()
            
            # Crear ZIP con el backup
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                zip_file.writestr(backup_filename, backup_content)
                # Agregar archivo de información
                info_content = f"""CVSS Scoring System Database Backup
Created: {datetime.now().isoformat()}
User: {current_user.name} ({current_user.email})
Database: PostgreSQL
Tables: users, vulnerabilities, evaluations, audit_logs, vulnerability_history, database_queries

This backup contains all data from the CVSS Scoring System database.
To restore, use the restore endpoint or pg_restore command.
"""
                zip_file.writestr('backup_info.txt', info_content)
            
            zip_buffer.seek(0)
            
            # Registrar la acción
            db_query = DatabaseQuery(
                user_id=current_user_id,
                username=current_user.name,
                query_type='BACKUP',
                query_text=f'Database backup created: {backup_filename}',
                execution_time=0,
                success=True,
                ip_address=request.remote_addr
            )
            db.session.add(db_query)
            db.session.commit()
            
            return Response(
                zip_buffer.getvalue(),
                mimetype='application/zip',
                headers={
                    'Content-Disposition': f'attachment; filename=cvss_backup_{timestamp}.zip',
                    'Content-Length': len(zip_buffer.getvalue())
                }
            )
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        return jsonify({'error': f'Backup failed: {str(e)}'}), 500

@database_bp.route('/backup/status', methods=['GET'])
@jwt_required()
@admin_required
def get_backup_status():
    """Obtener información sobre el estado de backup de la base de datos"""
    try:
        database_url = os.environ.get('DATABASE_URL')
        
        info = {
            'database_type': 'PostgreSQL' if database_url else 'SQLite',
            'backup_available': bool(database_url),
            'tables': [],
            'total_records': 0,
            'last_backup': None
        }
        
        if database_url:
            # Obtener información de las tablas
            tables = ['users', 'vulnerabilities', 'evaluations', 'audit_logs', 'vulnerability_history', 'database_queries']
            
            for table in tables:
                try:
                    count = DatabaseManagerService.get_table_count(table)
                    info['tables'].append({
                        'name': table,
                        'count': count.get('count', 0)
                    })
                    info['total_records'] += count.get('count', 0)
                except:
                    info['tables'].append({
                        'name': table,
                        'count': 0
                    })
            
            # Obtener último backup del historial
            last_backup = DatabaseQuery.query.filter_by(
                query_type='BACKUP', 
                success=True
            ).order_by(DatabaseQuery.timestamp.desc()).first()
            
            if last_backup:
                info['last_backup'] = last_backup.timestamp.isoformat()
        
        return jsonify(info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@database_bp.route('/export/full', methods=['GET'])
@jwt_required()
@admin_required
def export_full_database():
    """Exportar toda la base de datos en formato JSON"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Obtener datos de todas las tablas
        tables = ['users', 'vulnerabilities', 'evaluations', 'audit_logs', 'vulnerability_history', 'database_queries']
        export_data = {
            'export_info': {
                'created_at': datetime.now().isoformat(),
                'exported_by': f"{current_user.name} ({current_user.email})",
                'tables': tables
            },
            'data': {}
        }
        
        for table in tables:
            try:
                table_data = DatabaseManagerService.get_table_data(table, limit=10000, offset=0)
                if 'error' not in table_data:
                    export_data['data'][table] = {
                        'columns': table_data.get('columns', []),
                        'rows': table_data.get('data', [])
                    }
            except Exception as e:
                export_data['data'][table] = {
                    'error': str(e),
                    'columns': [],
                    'rows': []
                }
        
        # Crear archivo JSON
        json_content = json.dumps(export_data, indent=2, default=str)
        
        # Crear ZIP con el JSON
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            zip_file.writestr(f'cvss_export_{timestamp}.json', json_content)
            
            # Agregar archivo de información
            info_content = f"""CVSS Scoring System Full Database Export
Created: {datetime.now().isoformat()}
User: {current_user.name} ({current_user.email})
Format: JSON
Tables: {', '.join(tables)}

This export contains all data from the CVSS Scoring System database in JSON format.
You can use this file to restore data or migrate to another system.
"""
            zip_file.writestr('export_info.txt', info_content)
        
        zip_buffer.seek(0)
        
        # Registrar la acción
        db_query = DatabaseQuery(
            user_id=current_user_id,
            username=current_user.name,
            query_type='EXPORT',
            query_text=f'Full database export created',
            execution_time=0,
            success=True,
            ip_address=request.remote_addr
        )
        db.session.add(db_query)
        db.session.commit()
        
        return Response(
            zip_buffer.getvalue(),
            mimetype='application/zip',
            headers={
                'Content-Disposition': f'attachment; filename=cvss_full_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip',
                'Content-Length': len(zip_buffer.getvalue())
            }
        )
        
    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500
