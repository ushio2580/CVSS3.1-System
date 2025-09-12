import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from datetime import datetime, timedelta
from app.models.vulnerability import Vulnerability, Severity, Status, Source
from sqlalchemy import func
from app import db

class ChartService:
    @staticmethod
    def setup_style():
        """Setup matplotlib style for professional charts"""
        plt.style.use('default')
        sns.set_palette("husl")
        plt.rcParams['font.size'] = 10
        plt.rcParams['axes.titlesize'] = 12
        plt.rcParams['axes.labelsize'] = 10
        plt.rcParams['xtick.labelsize'] = 9
        plt.rcParams['ytick.labelsize'] = 9
        plt.rcParams['legend.fontsize'] = 9
        plt.rcParams['figure.titlesize'] = 14

    @staticmethod
    def generate_severity_pie_chart(vulnerabilities):
        """Generate severity distribution pie chart"""
        ChartService.setup_style()
        
        # Count vulnerabilities by severity
        severity_counts = {}
        for vuln in vulnerabilities:
            severity = vuln.severity.value if vuln.severity else 'Unknown'
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        if not severity_counts:
            return None
        
        # Create pie chart
        fig, ax = plt.subplots(figsize=(8, 6))
        colors = ['#dc2626', '#ea580c', '#d97706', '#16a34a']  # Red, Orange, Yellow, Green
        
        labels = list(severity_counts.keys())
        sizes = list(severity_counts.values())
        
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct='%1.1f%%', 
                                         colors=colors[:len(labels)], startangle=90)
        
        # Enhance text
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
        
        ax.set_title('Vulnerability Distribution by Severity', fontweight='bold', pad=20)
        
        # Save to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64

    @staticmethod
    def generate_status_bar_chart(vulnerabilities):
        """Generate status distribution bar chart"""
        ChartService.setup_style()
        
        # Count vulnerabilities by status
        status_counts = {}
        for vuln in vulnerabilities:
            status = vuln.status.value if vuln.status else 'Unknown'
            status_counts[status] = status_counts.get(status, 0) + 1
        
        if not status_counts:
            return None
        
        # Create bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        
        statuses = list(status_counts.keys())
        counts = list(status_counts.values())
        colors = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280']  # Blue, Orange, Green, Gray
        
        bars = ax.bar(statuses, counts, color=colors[:len(statuses)], alpha=0.8)
        
        # Add value labels on bars
        for bar, count in zip(bars, counts):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                   f'{count}', ha='center', va='bottom', fontweight='bold')
        
        ax.set_title('Vulnerability Distribution by Status', fontweight='bold', pad=20)
        ax.set_xlabel('Status')
        ax.set_ylabel('Count')
        ax.grid(axis='y', alpha=0.3)
        
        # Rotate x-axis labels if needed
        plt.xticks(rotation=45, ha='right')
        
        # Save to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64

    @staticmethod
    def generate_trend_chart(days=30):
        """Generate vulnerability trend over time"""
        ChartService.setup_style()
        
        # Get vulnerability counts by date
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Query vulnerabilities by date
        daily_counts = db.session.query(
            func.date(Vulnerability.created_at).label('date'),
            func.count(Vulnerability.id).label('count')
        ).filter(
            Vulnerability.created_at >= start_date
        ).group_by(
            func.date(Vulnerability.created_at)
        ).order_by(
            func.date(Vulnerability.created_at)
        ).all()
        
        if not daily_counts:
            return None
        
        # Create trend chart
        fig, ax = plt.subplots(figsize=(12, 6))
        
        dates = [str(count.date) for count in daily_counts]
        counts = [count.count for count in daily_counts]
        
        ax.plot(dates, counts, marker='o', linewidth=2, markersize=6, 
               color='#3b82f6', alpha=0.8)
        ax.fill_between(dates, counts, alpha=0.3, color='#3b82f6')
        
        ax.set_title(f'Vulnerability Trend (Last {days} Days)', fontweight='bold', pad=20)
        ax.set_xlabel('Date')
        ax.set_ylabel('Number of Vulnerabilities')
        ax.grid(True, alpha=0.3)
        
        # Rotate x-axis labels
        plt.xticks(rotation=45, ha='right')
        
        # Add value labels on points
        for i, (date, count) in enumerate(zip(dates, counts)):
            ax.annotate(str(count), (i, count), textcoords="offset points", 
                       xytext=(0,10), ha='center', fontweight='bold')
        
        # Save to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64

    @staticmethod
    def generate_source_chart(vulnerabilities):
        """Generate source distribution chart"""
        ChartService.setup_style()
        
        # Count vulnerabilities by source
        source_counts = {}
        for vuln in vulnerabilities:
            source = vuln.source.value if vuln.source else 'Unknown'
            source_counts[source] = source_counts.get(source, 0) + 1
        
        if not source_counts:
            return None
        
        # Create horizontal bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        
        sources = list(source_counts.keys())
        counts = list(source_counts.values())
        colors = ['#8b5cf6', '#06b6d4', '#84cc16']  # Purple, Cyan, Green
        
        bars = ax.barh(sources, counts, color=colors[:len(sources)], alpha=0.8)
        
        # Add value labels on bars
        for bar, count in zip(bars, counts):
            width = bar.get_width()
            ax.text(width + 0.1, bar.get_y() + bar.get_height()/2.,
                   f'{count}', ha='left', va='center', fontweight='bold')
        
        ax.set_title('Vulnerability Distribution by Source', fontweight='bold', pad=20)
        ax.set_xlabel('Count')
        ax.set_ylabel('Source')
        ax.grid(axis='x', alpha=0.3)
        
        # Save to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64

    @staticmethod
    def generate_score_distribution_chart(vulnerabilities):
        """Generate CVSS score distribution chart"""
        ChartService.setup_style()
        
        # Get CVSS scores
        scores = [vuln.base_score for vuln in vulnerabilities if vuln.base_score is not None]
        
        if not scores:
            return None
        
        # Create histogram
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Define score ranges
        bins = [0, 4, 7, 9, 10]
        labels = ['Low (0-3.9)', 'Medium (4-6.9)', 'High (7-8.9)', 'Critical (9-10)']
        
        ax.hist(scores, bins=bins, alpha=0.7, color='#3b82f6', edgecolor='black', linewidth=1)
        
        ax.set_title('CVSS Score Distribution', fontweight='bold', pad=20)
        ax.set_xlabel('CVSS Score')
        ax.set_ylabel('Number of Vulnerabilities')
        ax.grid(axis='y', alpha=0.3)
        
        # Add statistics
        mean_score = sum(scores) / len(scores)
        ax.axvline(mean_score, color='red', linestyle='--', linewidth=2, 
                  label=f'Mean: {mean_score:.1f}')
        ax.legend()
        
        # Save to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64
