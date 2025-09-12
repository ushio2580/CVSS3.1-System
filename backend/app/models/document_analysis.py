from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app import db

class DocumentAnalysis(db.Model):
    __tablename__ = 'document_analyses'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, doc, docx
    
    # Analysis results
    extracted_text = Column(Text, nullable=True)
    extracted_text_preview = Column(Text, nullable=True)
    vulnerability_types = Column(JSON, nullable=True)  # List of detected vulnerability types
    cvss_score = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)  # critical, high, medium, low, info
    cvss_components = Column(JSON, nullable=True)  # CVSS component scores
    recommendations = Column(JSON, nullable=True)  # List of recommendations
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship('User', backref='document_analyses')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'extracted_text_preview': self.extracted_text_preview,
            'vulnerability_types': self.vulnerability_types,
            'cvss_score': self.cvss_score,
            'severity': self.severity,
            'cvss_components': self.cvss_components,
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<DocumentAnalysis {self.filename} - {self.severity}>'
