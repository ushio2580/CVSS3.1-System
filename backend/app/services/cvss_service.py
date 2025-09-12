from typing import Dict, Optional, Tuple
import re

class CVSSService:
    """Service for CVSS v3.1 calculations and vector parsing"""
    
    # CVSS v3.1 Base Metrics
    BASE_METRICS = {
        'AV': ['N', 'A', 'L', 'P'],  # Attack Vector
        'AC': ['L', 'H'],            # Attack Complexity
        'PR': ['N', 'L', 'H'],       # Privileges Required
        'UI': ['N', 'R'],            # User Interaction
        'S': ['U', 'C'],             # Scope
        'C': ['N', 'L', 'H'],        # Confidentiality Impact
        'I': ['N', 'L', 'H'],        # Integrity Impact
        'A': ['N', 'L', 'H']         # Availability Impact
    }
    
    # Temporal Metrics
    TEMPORAL_METRICS = {
        'E': ['X', 'U', 'P', 'F', 'H'],  # Exploit Code Maturity
        'RL': ['X', 'U', 'W', 'T', 'O'], # Remediation Level
        'RC': ['X', 'U', 'R', 'C']       # Report Confidence
    }
    
    # Environmental Metrics
    ENVIRONMENTAL_METRICS = {
        'CR': ['X', 'L', 'M', 'H'],      # Confidentiality Requirement
        'IR': ['X', 'L', 'M', 'H'],      # Integrity Requirement
        'AR': ['X', 'L', 'M', 'H'],      # Availability Requirement
        'MAV': ['X', 'N', 'A', 'L', 'P'], # Modified Attack Vector
        'MAC': ['X', 'L', 'H'],          # Modified Attack Complexity
        'MPR': ['X', 'N', 'L', 'H'],     # Modified Privileges Required
        'MUI': ['X', 'N', 'R'],          # Modified User Interaction
        'MS': ['X', 'U', 'C'],           # Modified Scope
        'MC': ['X', 'N', 'L', 'H'],      # Modified Confidentiality Impact
        'MI': ['X', 'N', 'L', 'H'],      # Modified Integrity Impact
        'MA': ['X', 'N', 'L', 'H']       # Modified Availability Impact
    }
    
    @staticmethod
    def parse_vector(vector: str) -> Dict[str, str]:
        """Parse CVSS vector string into metrics dictionary"""
        if not vector:
            raise ValueError("Vector cannot be empty")
        
        # Normalize vector format
        vector = vector.strip()
        
        # Handle different CVSS formats
        if vector.startswith('CVSS:3.1/'):
            # Standard format: CVSS:3.1/AV:N/AC:L/...
            vector = vector.replace('CVSS:3.1/', '')
        elif vector.startswith('CVSS:'):
            # Old format: CVSS:AV:N/AC:L/...
            vector = vector.replace('CVSS:', '')
        elif vector.startswith('AV:'):
            # Direct format: AV:N/AC:L/...
            pass
        else:
            raise ValueError("Invalid CVSS vector format. Expected format: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H")
        
        metrics = {}
        parts = vector.split('/')
        
        for part in parts:
            if ':' in part:
                key, value = part.split(':', 1)
                metrics[key] = value
        
        return metrics
    
    @staticmethod
    def validate_metrics(metrics: Dict[str, str]) -> bool:
        """Validate that all metrics have valid values"""
        for metric, value in metrics.items():
            if metric in CVSSService.BASE_METRICS:
                if value not in CVSSService.BASE_METRICS[metric]:
                    return False
            elif metric in CVSSService.TEMPORAL_METRICS:
                if value not in CVSSService.TEMPORAL_METRICS[metric]:
                    return False
            elif metric in CVSSService.ENVIRONMENTAL_METRICS:
                if value not in CVSSService.ENVIRONMENTAL_METRICS[metric]:
                    return False
        
        return True
    
    @staticmethod
    def calculate_base_score(metrics: Dict[str, str]) -> float:
        """Calculate CVSS Base Score from metrics"""
        # Base metrics scoring values
        av_scores = {'N': 0.85, 'A': 0.62, 'L': 0.55, 'P': 0.2}
        ac_scores = {'L': 0.77, 'H': 0.44}
        pr_scores = {'N': 0.85, 'L': 0.62, 'H': 0.27}
        ui_scores = {'N': 0.85, 'R': 0.62}
        
        # Impact scoring values
        c_scores = {'N': 0, 'L': 0.22, 'H': 0.56}
        i_scores = {'N': 0, 'L': 0.22, 'H': 0.56}
        a_scores = {'N': 0, 'L': 0.22, 'H': 0.56}
        
        # Get values from metrics (default to 'N' if not present)
        av = metrics.get('AV', 'N')
        ac = metrics.get('AC', 'L')
        pr = metrics.get('PR', 'N')
        ui = metrics.get('UI', 'N')
        s = metrics.get('S', 'U')
        c = metrics.get('C', 'N')
        i = metrics.get('I', 'N')
        a = metrics.get('A', 'N')
        
        # Calculate Exploitability
        exploitability = 8.22 * av_scores[av] * ac_scores[ac] * pr_scores[pr] * ui_scores[ui]
        
        # Calculate Impact
        impact = 1 - ((1 - c_scores[c]) * (1 - i_scores[i]) * (1 - a_scores[a]))
        
        # Calculate Base Score
        if impact <= 0:
            base_score = 0
        elif s == 'U':  # Unchanged scope
            base_score = min(10, impact + exploitability)
        else:  # Changed scope
            base_score = min(10, 1.08 * (impact + exploitability))
        
        return round(base_score, 1)
    
    @staticmethod
    def calculate_temporal_score(base_score: float, metrics: Dict[str, str]) -> float:
        """Calculate CVSS Temporal Score"""
        # Temporal scoring values
        e_scores = {'X': 1, 'U': 0.91, 'P': 0.94, 'F': 0.97, 'H': 1}
        rl_scores = {'X': 1, 'U': 1, 'W': 0.97, 'T': 0.96, 'O': 0.95}
        rc_scores = {'X': 1, 'U': 0.92, 'R': 0.96, 'C': 1}
        
        # Get values (default to 'X' if not present)
        e = metrics.get('E', 'X')
        rl = metrics.get('RL', 'X')
        rc = metrics.get('RC', 'X')
        
        # Calculate temporal score
        temporal_score = base_score * e_scores[e] * rl_scores[rl] * rc_scores[rc]
        
        return round(temporal_score, 1)
    
    @staticmethod
    def calculate_environmental_score(base_score: float, metrics: Dict[str, str]) -> float:
        """Calculate CVSS Environmental Score"""
        # This is a simplified implementation
        # Full environmental score calculation is complex and depends on modified metrics
        
        # For now, return base score if no environmental metrics
        env_metrics = {k: v for k, v in metrics.items() if k.startswith('M') or k in ['CR', 'IR', 'AR']}
        
        if not env_metrics:
            return base_score
        
        # Simplified environmental calculation
        # In a real implementation, you would need to recalculate with modified metrics
        return base_score
    
    @staticmethod
    def get_severity(score: float) -> str:
        """Get severity level from score"""
        if score >= 9.0:
            return "Critical"
        elif score >= 7.0:
            return "High"
        elif score >= 4.0:
            return "Medium"
        else:
            return "Low"
    
    @staticmethod
    def generate_vector(metrics: Dict[str, str]) -> str:
        """Generate CVSS vector string from metrics"""
        vector_parts = []
        
        # Add base metrics in order
        base_order = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A']
        for metric in base_order:
            if metric in metrics:
                vector_parts.append(f"{metric}:{metrics[metric]}")
        
        # Add temporal metrics
        temporal_order = ['E', 'RL', 'RC']
        for metric in temporal_order:
            if metric in metrics:
                vector_parts.append(f"{metric}:{metrics[metric]}")
        
        # Add environmental metrics
        env_order = ['CR', 'IR', 'AR', 'MAV', 'MAC', 'MPR', 'MUI', 'MS', 'MC', 'MI', 'MA']
        for metric in env_order:
            if metric in metrics:
                vector_parts.append(f"{metric}:{metrics[metric]}")
        
        return f"CVSS:3.1/{'/'.join(vector_parts)}"
    
    @staticmethod
    def calculate_all_scores(vector: str) -> Dict[str, float]:
        """Calculate all CVSS scores from vector"""
        try:
            metrics = CVSSService.parse_vector(vector)
            
            if not CVSSService.validate_metrics(metrics):
                raise ValueError("Invalid metrics in CVSS vector")
            
            base_score = CVSSService.calculate_base_score(metrics)
            temporal_score = CVSSService.calculate_temporal_score(base_score, metrics)
            environmental_score = CVSSService.calculate_environmental_score(base_score, metrics)
            
            return {
                'base_score': base_score,
                'temporal_score': temporal_score,
                'environmental_score': environmental_score,
                'severity': CVSSService.get_severity(base_score)
            }
        except Exception as e:
            raise ValueError(f"Error calculating CVSS scores: {str(e)}")

