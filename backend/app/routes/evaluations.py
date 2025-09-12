from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.evaluation import Evaluation
from app.models.vulnerability import Vulnerability
from app.models.user import User
from app.utils.authorization import analyst_required
from sqlalchemy import desc
from datetime import datetime
import json

evaluations_bp = Blueprint('evaluations', __name__)

@evaluations_bp.route('/vulnerability/<int:vuln_id>', methods=['GET'])
@jwt_required()
def get_vulnerability_evaluations(vuln_id):
    """Get all evaluations for a specific vulnerability"""
    try:
        evaluations = Evaluation.query.filter_by(vuln_id=vuln_id).order_by(desc(Evaluation.created_at)).all()
        
        # Get author names
        evaluation_data = []
        for eval in evaluations:
            author = User.query.get(eval.author_id)
            eval_dict = eval.to_dict()
            eval_dict['author_name'] = author.name if author else 'Unknown'
            evaluation_data.append(eval_dict)
        
        return jsonify({
            'success': True,
            'evaluations': evaluation_data,
            'count': len(evaluation_data)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching evaluations: {str(e)}'
        }), 500

@evaluations_bp.route('/vulnerability/<int:vuln_id>', methods=['POST'])
@jwt_required()
@analyst_required
def create_evaluation(vuln_id):
    """Create a new evaluation for a vulnerability"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['metrics', 'base_score']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Validate vulnerability exists
        vulnerability = Vulnerability.query.get(vuln_id)
        if not vulnerability:
            return jsonify({
                'success': False,
                'message': 'Vulnerability not found'
            }), 404
        
        # Create evaluation
        evaluation = Evaluation(
            vuln_id=vuln_id,
            metrics=data['metrics'],
            base_score=data['base_score'],
            author_id=current_user_id,
            temporal_score=data.get('temporal_score'),
            environmental_score=data.get('environmental_score')
        )
        
        db.session.add(evaluation)
        db.session.commit()
        
        # Get author name
        author = User.query.get(current_user_id)
        eval_dict = evaluation.to_dict()
        eval_dict['author_name'] = author.name if author else 'Unknown'
        
        return jsonify({
            'success': True,
            'evaluation': eval_dict,
            'message': 'Evaluation created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating evaluation: {str(e)}'
        }), 500

@evaluations_bp.route('/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation(evaluation_id):
    """Get a specific evaluation"""
    try:
        evaluation = Evaluation.query.get(evaluation_id)
        if not evaluation:
            return jsonify({
                'success': False,
                'message': 'Evaluation not found'
            }), 404
        
        # Get author name
        author = User.query.get(evaluation.author_id)
        eval_dict = evaluation.to_dict()
        eval_dict['author_name'] = author.name if author else 'Unknown'
        
        return jsonify({
            'success': True,
            'evaluation': eval_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching evaluation: {str(e)}'
        }), 500

@evaluations_bp.route('/<int:evaluation_id>', methods=['PUT'])
@jwt_required()
@analyst_required
def update_evaluation(evaluation_id):
    """Update an evaluation"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        evaluation = Evaluation.query.get(evaluation_id)
        if not evaluation:
            return jsonify({
                'success': False,
                'message': 'Evaluation not found'
            }), 404
        
        # Only author can update evaluation
        if evaluation.author_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'You can only update your own evaluations'
            }), 403
        
        # Update fields
        if 'metrics' in data:
            evaluation.metrics = data['metrics']
        if 'base_score' in data:
            evaluation.base_score = data['base_score']
        if 'temporal_score' in data:
            evaluation.temporal_score = data['temporal_score']
        if 'environmental_score' in data:
            evaluation.environmental_score = data['environmental_score']
        
        evaluation.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Get author name
        author = User.query.get(current_user_id)
        eval_dict = evaluation.to_dict()
        eval_dict['author_name'] = author.name if author else 'Unknown'
        
        return jsonify({
            'success': True,
            'evaluation': eval_dict,
            'message': 'Evaluation updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating evaluation: {str(e)}'
        }), 500

@evaluations_bp.route('/<int:evaluation_id>', methods=['DELETE'])
@jwt_required()
@analyst_required
def delete_evaluation(evaluation_id):
    """Delete an evaluation"""
    try:
        current_user_id = get_jwt_identity()
        
        evaluation = Evaluation.query.get(evaluation_id)
        if not evaluation:
            return jsonify({
                'success': False,
                'message': 'Evaluation not found'
            }), 404
        
        # Only author can delete evaluation
        if evaluation.author_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'You can only delete your own evaluations'
            }), 403
        
        db.session.delete(evaluation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Evaluation deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting evaluation: {str(e)}'
        }), 500

@evaluations_bp.route('/vulnerability/<int:vuln_id>/latest', methods=['GET'])
@jwt_required()
def get_latest_evaluation(vuln_id):
    """Get the latest evaluation for a vulnerability"""
    try:
        evaluation = Evaluation.query.filter_by(vuln_id=vuln_id).order_by(desc(Evaluation.created_at)).first()
        
        if not evaluation:
            return jsonify({
                'success': False,
                'message': 'No evaluations found for this vulnerability'
            }), 404
        
        # Get author name
        author = User.query.get(evaluation.author_id)
        eval_dict = evaluation.to_dict()
        eval_dict['author_name'] = author.name if author else 'Unknown'
        
        return jsonify({
            'success': True,
            'evaluation': eval_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching latest evaluation: {str(e)}'
        }), 500
