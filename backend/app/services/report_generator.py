from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import io
import base64
from datetime import datetime
from typing import List, Dict, Any
import csv
from io import StringIO
import json

class ProfessionalReportGenerator:
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for professional reports"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        # Subtitle style
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_LEFT,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        # Section style
        self.section_style = ParagraphStyle(
            'CustomSection',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=15,
            alignment=TA_LEFT,
            textColor=colors.darkgreen,
            fontName='Helvetica-Bold'
        )
        
        # Normal text style
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            alignment=TA_LEFT,
            fontName='Helvetica'
        )
        
        # Table header style
        self.table_header_style = ParagraphStyle(
            'TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.white
        )
    
    def generate_professional_pdf_report(self, data: Dict[str, Any], report_type: str = "vulnerability") -> bytes:
        """Generate a professional PDF report"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        
        story = []
        
        # Add header
        story.extend(self._create_header(report_type))
        
        # Add executive summary
        story.extend(self._create_executive_summary(data))
        
        # Add detailed sections based on report type
        if report_type == "vulnerability":
            story.extend(self._create_vulnerability_sections(data))
        elif report_type == "audit":
            story.extend(self._create_audit_sections(data))
        elif report_type == "dashboard":
            story.extend(self._create_dashboard_sections(data))
        
        # Add charts if available
        if 'charts' in data:
            story.extend(self._create_charts_section(data['charts']))
        
        # Add detailed data tables
        story.extend(self._create_detailed_tables(data))
        
        # Add footer
        story.extend(self._create_footer())
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _create_header(self, report_type: str) -> List:
        """Create professional header"""
        elements = []
        
        # Main title
        title = f"CVSS Vulnerability Assessment Report"
        elements.append(Paragraph(title, self.title_style))
        elements.append(Spacer(1, 20))
        
        # Report metadata
        metadata_data = [
            ['Report Type:', report_type.title()],
            ['Generated Date:', datetime.now().strftime('%B %d, %Y at %I:%M %p')],
            ['Report ID:', f"RPT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"],
            ['System Version:', 'CVSS Manager v1.0']
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(metadata_table)
        elements.append(Spacer(1, 30))
        
        return elements
    
    def _create_executive_summary(self, data: Dict[str, Any]) -> List:
        """Create executive summary section"""
        elements = []
        
        elements.append(Paragraph("Executive Summary", self.subtitle_style))
        elements.append(Spacer(1, 15))
        
        # KPIs summary
        if 'kpis' in data:
            kpis = data['kpis']
            summary_text = f"""
            This vulnerability assessment report provides a comprehensive analysis of the security posture 
            of the evaluated system. The assessment identified {kpis.get('total_vulnerabilities', 0)} total 
            vulnerabilities, with {kpis.get('critical_vulnerabilities', 0)} classified as Critical, 
            {kpis.get('high_vulnerabilities', 0)} as High, {kpis.get('medium_vulnerabilities', 0)} as Medium, 
            and {kpis.get('low_vulnerabilities', 0)} as Low severity.
            
            The overall risk score indicates a {self._get_risk_level(kpis)} risk level, requiring 
            immediate attention to critical and high-severity vulnerabilities to maintain system security.
            """
        else:
            summary_text = """
            This report provides a comprehensive analysis of the security assessment conducted on the system. 
            The findings are based on thorough vulnerability scanning and analysis using industry-standard 
            methodologies and tools.
            """
        
        elements.append(Paragraph(summary_text, self.normal_style))
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _get_risk_level(self, kpis: Dict[str, Any]) -> str:
        """Determine overall risk level based on KPIs"""
        critical = kpis.get('critical_vulnerabilities', 0)
        high = kpis.get('high_vulnerabilities', 0)
        
        if critical > 0:
            return "CRITICAL"
        elif high > 5:
            return "HIGH"
        elif high > 0:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _create_vulnerability_sections(self, data: Dict[str, Any]) -> List:
        """Create vulnerability-specific sections"""
        elements = []
        
        # Severity Distribution
        elements.append(Paragraph("Vulnerability Severity Distribution", self.section_style))
        elements.append(Spacer(1, 10))
        
        if 'kpis' in data:
            kpis = data['kpis']
            severity_data = [
                ['Severity Level', 'Count', 'Percentage'],
                ['Critical', str(kpis.get('critical_vulnerabilities', 0)), f"{self._calculate_percentage(kpis.get('critical_vulnerabilities', 0), kpis.get('total_vulnerabilities', 1))}%"],
                ['High', str(kpis.get('high_vulnerabilities', 0)), f"{self._calculate_percentage(kpis.get('high_vulnerabilities', 0), kpis.get('total_vulnerabilities', 1))}%"],
                ['Medium', str(kpis.get('medium_vulnerabilities', 0)), f"{self._calculate_percentage(kpis.get('medium_vulnerabilities', 0), kpis.get('total_vulnerabilities', 1))}%"],
                ['Low', str(kpis.get('low_vulnerabilities', 0)), f"{self._calculate_percentage(kpis.get('low_vulnerabilities', 0), kpis.get('total_vulnerabilities', 1))}%"]
            ]
            
            severity_table = Table(severity_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
            severity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 1), (0, 1), colors.red),
                ('BACKGROUND', (0, 2), (0, 2), colors.orange),
                ('BACKGROUND', (0, 3), (0, 3), colors.yellow),
                ('BACKGROUND', (0, 4), (0, 4), colors.green)
            ]))
            
            elements.append(severity_table)
            elements.append(Spacer(1, 20))
        
        return elements
    
    def _create_audit_sections(self, data: Dict[str, Any]) -> List:
        """Create audit-specific sections"""
        elements = []
        
        elements.append(Paragraph("Audit Log Analysis", self.section_style))
        elements.append(Spacer(1, 10))
        
        if 'logs' in data:
            logs = data['logs']
            audit_summary = f"""
            The audit analysis covers {len(logs)} log entries from the system. 
            Key activities include user authentication, vulnerability management, 
            and system configuration changes.
            """
            elements.append(Paragraph(audit_summary, self.normal_style))
            elements.append(Spacer(1, 15))
        
        return elements
    
    def _create_dashboard_sections(self, data: Dict[str, Any]) -> List:
        """Create dashboard-specific sections"""
        elements = []
        
        elements.append(Paragraph("Dashboard Overview", self.section_style))
        elements.append(Spacer(1, 10))
        
        dashboard_summary = """
        This dashboard report provides a comprehensive overview of the system's 
        security posture, including vulnerability trends, risk assessments, 
        and key performance indicators.
        """
        elements.append(Paragraph(dashboard_summary, self.normal_style))
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _create_charts_section(self, charts_data: Dict[str, Any]) -> List:
        """Create charts section with embedded images"""
        elements = []
        
        elements.append(Paragraph("Visual Analytics", self.section_style))
        elements.append(Spacer(1, 10))
        
        # Generate charts
        charts = self._generate_charts(charts_data)
        
        for chart_name, chart_image in charts.items():
            elements.append(Paragraph(f"{chart_name}", self.normal_style))
            elements.append(Spacer(1, 10))
            
            # Add chart image
            if chart_image:
                elements.append(chart_image)
                elements.append(Spacer(1, 20))
        
        return elements
    
    def _generate_charts(self, charts_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate professional charts"""
        charts = {}
        
        # Set style for professional charts
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # Severity Distribution Pie Chart
        if 'severity_distribution' in charts_data:
            fig, ax = plt.subplots(figsize=(8, 6))
            severity_data = charts_data['severity_distribution']
            
            labels = list(severity_data.keys())
            sizes = list(severity_data.values())
            colors_chart = ['#ff4444', '#ff8800', '#ffcc00', '#00cc00']
            
            wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors_chart, autopct='%1.1f%%', startangle=90)
            ax.set_title('Vulnerability Severity Distribution', fontsize=14, fontweight='bold')
            
            # Save chart to buffer
            chart_buffer = io.BytesIO()
            plt.savefig(chart_buffer, format='png', dpi=300, bbox_inches='tight')
            chart_buffer.seek(0)
            
            # Convert to ReportLab image
            from reportlab.platypus import Image
            chart_image = Image(chart_buffer, width=6*inch, height=4.5*inch)
            charts['Severity Distribution'] = chart_image
            
            plt.close()
        
        # Trend Chart
        if 'trend_data' in charts_data:
            fig, ax = plt.subplots(figsize=(10, 6))
            trend_data = charts_data['trend_data']
            
            dates = [item['date'] for item in trend_data]
            counts = [item['count'] for item in trend_data]
            
            ax.plot(dates, counts, marker='o', linewidth=2, markersize=6)
            ax.set_title('Vulnerability Trend Over Time', fontsize=14, fontweight='bold')
            ax.set_xlabel('Date', fontsize=12)
            ax.set_ylabel('Number of Vulnerabilities', fontsize=12)
            ax.grid(True, alpha=0.3)
            
            # Rotate x-axis labels for better readability
            plt.xticks(rotation=45)
            
            # Save chart to buffer
            chart_buffer = io.BytesIO()
            plt.savefig(chart_buffer, format='png', dpi=300, bbox_inches='tight')
            chart_buffer.seek(0)
            
            # Convert to ReportLab image
            from reportlab.platypus import Image
            chart_image = Image(chart_buffer, width=7*inch, height=4*inch)
            charts['Vulnerability Trend'] = chart_image
            
            plt.close()
        
        return charts
    
    def _create_detailed_tables(self, data: Dict[str, Any]) -> List:
        """Create detailed data tables"""
        elements = []
        
        elements.append(Paragraph("Detailed Findings", self.section_style))
        elements.append(Spacer(1, 15))
        
        # Top Vulnerabilities Table
        if 'top_vulnerabilities' in data:
            elements.append(Paragraph("Top Vulnerabilities by Score", self.normal_style))
            elements.append(Spacer(1, 10))
            
            vuln_data = [['Title', 'Severity', 'Score', 'Status', 'Created']]
            
            for vuln in data['top_vulnerabilities'][:10]:  # Top 10
                title = vuln.get('title', '') or ''
                title_short = title[:50] + '...' if len(title) > 50 else title
                
                vuln_data.append([
                    title_short,
                    vuln.get('severity', 'N/A'),
                    str(vuln.get('base_score', 'N/A')),
                    vuln.get('status', 'N/A'),
                    vuln.get('created_at', 'N/A')[:10] if vuln.get('created_at') else 'N/A'
                ])
            
            vuln_table = Table(vuln_data, colWidths=[3*inch, 1*inch, 0.8*inch, 1*inch, 1*inch])
            vuln_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            
            elements.append(vuln_table)
            elements.append(Spacer(1, 20))
        
        return elements
    
    def _create_footer(self) -> List:
        """Create professional footer"""
        elements = []
        
        elements.append(PageBreak())
        elements.append(Spacer(1, 30))
        
        footer_text = """
        <b>Report Generated by CVSS Manager</b><br/>
        This report is automatically generated and contains confidential information.<br/>
        For questions or concerns, please contact the security team.<br/>
        Generated on: """ + datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        elements.append(Paragraph(footer_text, self.normal_style))
        
        return elements
    
    def _calculate_percentage(self, value: int, total: int) -> float:
        """Calculate percentage"""
        if total == 0:
            return 0.0
        return round((value / total) * 100, 1)
    
    def generate_professional_csv_report(self, data: Dict[str, Any], report_type: str = "vulnerability") -> str:
        """Generate a professional CSV report"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['CVSS Vulnerability Assessment Report'])
        writer.writerow([])
        writer.writerow(['Report Type:', report_type.title()])
        writer.writerow(['Generated Date:', datetime.now().strftime('%B %d, %Y at %I:%M %p')])
        writer.writerow(['Report ID:', f"RPT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"])
        writer.writerow(['System Version:', 'CVSS Manager v1.0'])
        writer.writerow([])
        
        # Write executive summary
        writer.writerow(['EXECUTIVE SUMMARY'])
        writer.writerow([])
        
        if 'kpis' in data:
            kpis = data['kpis']
            writer.writerow(['Total Vulnerabilities:', kpis.get('total_vulnerabilities', 0)])
            writer.writerow(['Critical Vulnerabilities:', kpis.get('critical_vulnerabilities', 0)])
            writer.writerow(['High Vulnerabilities:', kpis.get('high_vulnerabilities', 0)])
            writer.writerow(['Medium Vulnerabilities:', kpis.get('medium_vulnerabilities', 0)])
            writer.writerow(['Low Vulnerabilities:', kpis.get('low_vulnerabilities', 0)])
            writer.writerow(['Overall Risk Level:', self._get_risk_level(kpis)])
            writer.writerow([])
        
        # Write detailed data
        if 'vulnerabilities' in data:
            writer.writerow(['DETAILED VULNERABILITIES'])
            writer.writerow([])
            
            # Write headers
            headers = ['ID', 'Title', 'CVE ID', 'Severity', 'Base Score', 'Status', 'Source', 'Created Date', 'Description']
            writer.writerow(headers)
            
            # Write data
            for vuln in data['vulnerabilities']:
                description = vuln.get('description', '') or ''
                description_short = description[:100] + '...' if len(description) > 100 else description
                
                writer.writerow([
                    vuln.get('id', ''),
                    vuln.get('title', ''),
                    vuln.get('cve_id', ''),
                    vuln.get('severity', ''),
                    vuln.get('base_score', ''),
                    vuln.get('status', ''),
                    vuln.get('source', ''),
                    vuln.get('created_at', '')[:10] if vuln.get('created_at') else '',
                    description_short
                ])
        
        # Write footer
        writer.writerow([])
        writer.writerow(['Report Generated by CVSS Manager'])
        writer.writerow(['This report contains confidential information'])
        writer.writerow(['Generated on: ' + datetime.now().strftime('%B %d, %Y at %I:%M %p')])
        
        return output.getvalue()
