from app import db
from datetime import datetime
import json

class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    vuln_id = db.Column(db.Integer, db.ForeignKey('vulns.id'), nullable=False)
    metrics_json = db.Column(db.Text, nullable=False)  # JSON string of CVSS metrics
    base_score = db.Column(db.Float, nullable=False)
    temporal_score = db.Column(db.Float)
    environmental_score = db.Column(db.Float)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, vuln_id, metrics, base_score, author_id, temporal_score=None, environmental_score=None):
        self.vuln_id = vuln_id
        self.metrics_json = json.dumps(metrics) if isinstance(metrics, dict) else metrics
        self.base_score = base_score
        self.author_id = author_id
        self.temporal_score = temporal_score
        self.environmental_score = environmental_score
    
    @property
    def metrics(self):
        """Get metrics as dictionary"""
        try:
            return json.loads(self.metrics_json)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    @metrics.setter
    def metrics(self, value):
        """Set metrics from dictionary"""
        self.metrics_json = json.dumps(value) if isinstance(value, dict) else value
    
    def to_dict(self):
        return {
            'id': self.id,
            'vuln_id': self.vuln_id,
            'metrics': self.metrics,
            'base_score': self.base_score,
            'temporal_score': self.temporal_score,
            'environmental_score': self.environmental_score,
            'author_id': self.author_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Evaluation {self.id} for vuln {self.vuln_id}>'

