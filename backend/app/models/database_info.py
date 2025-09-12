from datetime import datetime
from app import db
import json

class DatabaseQuery(db.Model):
    __tablename__ = 'database_queries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    query_type = db.Column(db.String(50), nullable=False)  # SELECT, INSERT, UPDATE, DELETE, CREATE, DROP
    query_text = db.Column(db.Text, nullable=False)
    table_name = db.Column(db.String(100))
    affected_rows = db.Column(db.Integer)
    execution_time = db.Column(db.Float)  # en segundos
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45))
    
    # Relationship
    user = db.relationship('User', backref='database_queries')
    
    def __init__(self, user_id, username, query_type, query_text, table_name=None, 
                 affected_rows=None, execution_time=None, success=True, error_message=None, ip_address=None):
        self.user_id = user_id
        self.username = username
        self.query_type = query_type
        self.query_text = query_text
        self.table_name = table_name
        self.affected_rows = affected_rows
        self.execution_time = execution_time
        self.success = success
        self.error_message = error_message
        self.ip_address = ip_address
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'query_type': self.query_type,
            'query_text': self.query_text,
            'table_name': self.table_name,
            'affected_rows': self.affected_rows,
            'execution_time': self.execution_time,
            'success': self.success,
            'error_message': self.error_message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'ip_address': self.ip_address
        }
