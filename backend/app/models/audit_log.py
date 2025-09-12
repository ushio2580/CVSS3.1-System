from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSON
import json

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username = db.Column(db.String(100), nullable=False)  # Cache del username
    action = db.Column(db.String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    target_type = db.Column(db.String(50), nullable=False)  # vulnerability, user, evaluation, etc.
    target_id = db.Column(db.Integer)  # ID del objeto afectado
    target_name = db.Column(db.String(200))  # Nombre/título del objeto
    details = db.Column(db.Text)  # Detalles adicionales en JSON
    ip_address = db.Column(db.String(45))  # IP del usuario
    user_agent = db.Column(db.String(500))  # User agent del navegador
    success = db.Column(db.Boolean, default=True)  # Si la acción fue exitosa
    error_message = db.Column(db.Text)  # Mensaje de error si falló
    
    # Relationship is defined in User model with backref
    
    def __init__(self, user_id, username, action, target_type, target_id=None, 
                 target_name=None, details=None, ip_address=None, user_agent=None, 
                 success=True, error_message=None):
        self.user_id = user_id
        self.username = username
        self.action = action
        self.target_type = target_type
        self.target_id = target_id
        self.target_name = target_name
        self.details = details
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.success = success
        self.error_message = error_message
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_name': self.target_name,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'success': self.success,
            'error_message': self.error_message
        }
    
    @staticmethod
    def log_action(user_id, username, action, target_type, target_id=None, 
                   target_name=None, details=None, ip_address=None, user_agent=None, 
                   success=True, error_message=None):
        """Static method to create audit log entry"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                username=username,
                action=action,
                target_type=target_type,
                target_id=target_id,
                target_name=target_name,
                details=json.dumps(details) if details else None,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                error_message=error_message
            )
            db.session.add(audit_log)
            db.session.commit()
            return audit_log
        except Exception as e:
            db.session.rollback()
            print(f"Error creating audit log: {e}")
            return None
