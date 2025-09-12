from flask import request

def get_client_ip():
    """
    Get the real client IP address, even when behind a proxy
    
    Returns:
        str: The real client IP address
    """
    # Check for forwarded headers (common in proxy setups)
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, the first one is the client
        return forwarded_for.split(',')[0].strip()
    
    # Check for other common proxy headers
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Check for Cloudflare headers
    cf_connecting_ip = request.headers.get('CF-Connecting-IP')
    if cf_connecting_ip:
        return cf_connecting_ip
    
    # Check for AWS headers
    aws_ip = request.headers.get('X-Forwarded-For')
    if aws_ip:
        return aws_ip.split(',')[0].strip()
    
    # Fallback to remote_addr
    return request.remote_addr or 'Unknown'

def get_client_info():
    """
    Get comprehensive client information
    
    Returns:
        dict: Dictionary containing IP and other client info
    """
    return {
        'ip': get_client_ip(),
        'user_agent': request.headers.get('User-Agent', ''),
        'referer': request.headers.get('Referer', ''),
        'origin': request.headers.get('Origin', ''),
        'host': request.headers.get('Host', ''),
        'forwarded_for': request.headers.get('X-Forwarded-For', ''),
        'real_ip': request.headers.get('X-Real-IP', ''),
        'cf_connecting_ip': request.headers.get('CF-Connecting-IP', ''),
    }
