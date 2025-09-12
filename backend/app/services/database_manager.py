from app import db
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError
import time
from typing import Dict, List, Any, Optional, Tuple

class DatabaseManagerService:
    
    @staticmethod
    def get_database_info() -> Dict[str, Any]:
        """Obtener información general de la base de datos"""
        try:
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            table_info = []
            for table in tables:
                columns = inspector.get_columns(table)
                indexes = inspector.get_indexes(table)
                foreign_keys = inspector.get_foreign_keys(table)
                
                table_info.append({
                    'name': table,
                    'columns': len(columns),
                    'indexes': len(indexes),
                    'foreign_keys': len(foreign_keys),
                    'column_details': [
                        {
                            'name': col['name'],
                            'type': str(col['type']),
                            'nullable': col.get('nullable', True),
                            'primary_key': col.get('primary_key', False)
                        } for col in columns
                    ]
                })
            
            return {
                'database_name': db.engine.url.database,
                'database_type': db.engine.dialect.name,
                'total_tables': len(tables),
                'tables': table_info
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def get_table_structure(table_name: str) -> Dict[str, Any]:
        """Obtener estructura detallada de una tabla"""
        try:
            inspector = inspect(db.engine)
            
            if table_name not in inspector.get_table_names():
                return {'error': f'Table {table_name} not found'}
            
            columns = inspector.get_columns(table_name)
            indexes = inspector.get_indexes(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            
            return {
                'table_name': table_name,
                'columns': [
                    {
                        'name': col['name'],
                        'type': str(col['type']),
                        'nullable': col.get('nullable', True),
                        'primary_key': col.get('primary_key', False),
                        'default': col.get('default'),
                        'comment': col.get('comment')
                    } for col in columns
                ],
                'indexes': indexes,
                'foreign_keys': foreign_keys
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def execute_query(query_text: str, query_type: str = 'SELECT') -> Tuple[bool, Any, float]:
        """Ejecutar una consulta SQL de forma segura"""
        start_time = time.time()
        
        try:
            # Validaciones básicas de seguridad
            if not DatabaseManagerService._is_query_safe(query_text, query_type):
                return False, {'error': 'Query not allowed for security reasons'}, 0
            
            # Ejecutar la consulta
            result = db.session.execute(text(query_text))
            
            execution_time = time.time() - start_time
            
            if query_type.upper() == 'SELECT':
                # Para SELECT, devolver los resultados
                columns = result.keys()
                rows = [dict(zip(columns, row)) for row in result.fetchall()]
                return True, {'data': rows, 'columns': list(columns), 'row_count': len(rows)}, execution_time
            else:
                # Para INSERT, UPDATE, DELETE
                db.session.commit()
                return True, {'affected_rows': result.rowcount}, execution_time
                
        except SQLAlchemyError as e:
            db.session.rollback()
            execution_time = time.time() - start_time
            return False, {'error': str(e)}, execution_time
        except Exception as e:
            db.session.rollback()
            execution_time = time.time() - start_time
            return False, {'error': str(e)}, execution_time
    
    @staticmethod
    def get_table_data(table_name: str, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """Obtener datos de una tabla con paginación"""
        try:
            inspector = inspect(db.engine)
            
            if table_name not in inspector.get_table_names():
                return {'error': f'Table {table_name} not found'}
            
            # Obtener estructura de la tabla
            columns = inspector.get_columns(table_name)
            column_names = [col['name'] for col in columns]
            
            # Construir query segura
            query = f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}"
            
            success, result, execution_time = DatabaseManagerService.execute_query(query, 'SELECT')
            
            if success:
                return {
                    'table_name': table_name,
                    'columns': column_names,
                    'data': result.get('data', []),
                    'row_count': result.get('row_count', 0),
                    'execution_time': execution_time,
                    'limit': limit,
                    'offset': offset
                }
            else:
                return result
                
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def get_table_count(table_name: str) -> Dict[str, Any]:
        """Obtener el número total de filas en una tabla"""
        try:
            query = f"SELECT COUNT(*) as count FROM {table_name}"
            success, result, execution_time = DatabaseManagerService.execute_query(query, 'SELECT')
            
            if success:
                return {
                    'table_name': table_name,
                    'count': result.get('data', [{}])[0].get('count', 0),
                    'execution_time': execution_time
                }
            else:
                return result
                
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def _is_query_safe(query_text: str, query_type: str) -> bool:
        """Validar si una consulta es segura para ejecutar"""
        query_upper = query_text.upper().strip()
        
        # Lista de palabras prohibidas
        forbidden_keywords = [
            'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE', 
            'EXEC', 'EXECUTE', 'SP_', 'XP_', '--', '/*', '*/'
        ]
        
        # Verificar palabras prohibidas
        for keyword in forbidden_keywords:
            if keyword in query_upper:
                return False
        
        # Verificar que la consulta comience con el tipo esperado
        if query_type.upper() == 'SELECT' and not query_upper.startswith('SELECT'):
            return False
        elif query_type.upper() == 'INSERT' and not query_upper.startswith('INSERT'):
            return False
        elif query_type.upper() == 'UPDATE' and not query_upper.startswith('UPDATE'):
            return False
        elif query_type.upper() == 'DELETE' and not query_upper.startswith('DELETE'):
            return False
        
        return True
    
    @staticmethod
    def get_query_suggestions() -> List[Dict[str, str]]:
        """Obtener sugerencias de consultas comunes"""
        return [
            {
                'name': 'Ver todas las tablas',
                'query': 'SELECT name FROM sqlite_master WHERE type="table"',
                'type': 'SELECT',
                'description': 'Muestra todas las tablas en la base de datos'
            },
            {
                'name': 'Ver estructura de usuarios',
                'query': 'SELECT * FROM users LIMIT 5',
                'type': 'SELECT',
                'description': 'Muestra los primeros 5 usuarios'
            },
            {
                'name': 'Ver vulnerabilidades críticas',
                'query': 'SELECT title, severity, status FROM vulns WHERE severity = "Critical"',
                'type': 'SELECT',
                'description': 'Muestra vulnerabilidades con severidad crítica'
            },
            {
                'name': 'Contar vulnerabilidades por severidad',
                'query': 'SELECT severity, COUNT(*) as count FROM vulns GROUP BY severity',
                'type': 'SELECT',
                'description': 'Cuenta vulnerabilidades agrupadas por severidad'
            },
            {
                'name': 'Ver logs de auditoría recientes',
                'query': 'SELECT action, username, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 10',
                'type': 'SELECT',
                'description': 'Muestra los 10 logs de auditoría más recientes'
            }
        ]
