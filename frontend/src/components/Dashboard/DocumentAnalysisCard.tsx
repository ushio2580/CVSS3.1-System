import React, { useState, useEffect } from 'react';
import { ResponsiveCard } from '../ui/responsive-wrapper';
import { API_CONFIG } from '../../config/api';

interface DocumentAnalysis {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  cvss_score: number;
  severity: string;
  vulnerability_types: string[];
  created_at: string;
}

const DocumentAnalysisCard: React.FC = () => {
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const fetchRecentAnalyses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses.slice(0, 5)); // Show only last 5
      }
    } catch (error) {
      console.error('Error fetching document analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Document Analyses</h3>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  if (analyses.length === 0) {
    return (
      <ResponsiveCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Document Analyses</h3>
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No document analyses yet</p>
            <p className="text-sm">Upload documents to see analysis results here</p>
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Document Analyses</h3>
          <a 
            href="/document-analysis-history" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </a>
        </div>
        
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{analysis.filename}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>CVSS: {analysis.cvss_score}</span>
                    <span>{formatFileSize(analysis.file_size)}</span>
                    <span>{formatDate(analysis.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {analysis.vulnerability_types.length} vulnerabilities
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveCard>
  );
};

export default DocumentAnalysisCard;
