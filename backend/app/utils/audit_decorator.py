from functools import wraps
from flask import request, g
from flask_jwt_extended import get_jwt_identity
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.ip_utils import get_client_ip, get_client_info
import json

def audit_log(action, target_type=None, get_target_id=None, get_target_name=None, get_details=None, require_auth=True):
    """
    Decorator to automatically log user actions
    
    Args:
        action (str): The action being performed (e.g., 'CREATE_VULNERABILITY')
        target_type (str): The type of target (e.g., 'vulnerability', 'user')
        get_target_id (callable): Function to get target ID from request/response
        get_target_name (callable): Function to get target name from request/response
        get_details (callable): Function to get additional details from request/response
        require_auth (bool): Whether this route requires authentication
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user info
            user_id = None
            username = 'Unknown'
            
            if require_auth:
                try:
                    user_id = get_jwt_identity()
                    user = User.query.get(user_id) if user_id else None
                    username = user.name if user else 'Unknown'
                except RuntimeError:
                    # JWT not available (e.g., login route)
                    user_id = None
                    username = 'Unauthenticated'
            
            # Get request info
            ip_address = get_client_ip()
            user_agent = request.headers.get('User-Agent', '')
            
            # Initialize variables
            target_id = None
            target_name = None
            details = None
            success = True
            error_message = None
            
            try:
                # Execute the original function
                response = f(*args, **kwargs)
                
                # Extract target info if functions provided
                if get_target_id:
                    try:
                        target_id = get_target_id(request, response, *args, **kwargs)
                    except Exception as e:
                        print(f"Error getting target_id: {e}")
                
                if get_target_name:
                    try:
                        target_name = get_target_name(request, response, *args, **kwargs)
                    except Exception as e:
                        print(f"Error getting target_name: {e}")
                
                if get_details:
                    try:
                        details = get_details(request, response, *args, **kwargs)
                    except Exception as e:
                        print(f"Error getting details: {e}")
                
                # Log successful action
                AuditLog.log_action(
                    user_id=user_id,
                    username=username,
                    action=action,
                    target_type=target_type,
                    target_id=target_id,
                    target_name=target_name,
                    details=details,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=True
                )
                
                return response
                
            except Exception as e:
                # Log failed action
                success = False
                error_message = str(e)
                
                AuditLog.log_action(
                    user_id=user_id,
                    username=username,
                    action=action,
                    target_type=target_type,
                    target_id=target_id,
                    target_name=target_name,
                    details=details,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    error_message=error_message
                )
                
                # Re-raise the exception
                raise
        
        return decorated_function
    return decorator

# Helper functions for common scenarios
def get_vulnerability_id_from_response(request, response, *args, **kwargs):
    """Extract vulnerability ID from response"""
    if hasattr(response, 'json') and response.json:
        return response.json.get('id')
    return None

def get_vulnerability_name_from_request(request, response, *args, **kwargs):
    """Extract vulnerability title from request"""
    if request.is_json:
        return request.get_json().get('title')
    elif request.form:
        return request.form.get('title')
    return None

def get_vulnerability_details_from_request(request, response, *args, **kwargs):
    """Extract vulnerability details from request"""
    if request.is_json:
        data = request.get_json()
        return {
            'severity': data.get('severity'),
            'status': data.get('status'),
            'vector': data.get('vector'),
            'cve_id': data.get('cve_id')
        }
    elif request.form:
        return {
            'severity': request.form.get('severity'),
            'status': request.form.get('status'),
            'vector': request.form.get('vector'),
            'cve_id': request.form.get('cve_id')
        }
    return None

def get_user_id_from_response(request, response, *args, **kwargs):
    """Extract user ID from response"""
    if hasattr(response, 'json') and response.json:
        return response.json.get('id')
    return None

def get_user_details_from_request(request, response, *args, **kwargs):
    """Extract user details from request"""
    if request.is_json:
        data = request.get_json()
        return {
            'username': data.get('username'),
            'email': data.get('email'),
            'role': data.get('role')
        }
    return None

def get_bulk_upload_details_from_request(request, response, *args, **kwargs):
    """Extract bulk upload details from request"""
    if request.files:
        file = request.files.get('file')
        if file:
            return {
                'filename': file.filename,
                'file_size': len(file.read()),
                'file_type': file.content_type
            }
    return None
