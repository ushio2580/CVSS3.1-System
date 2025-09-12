import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveWrapper, ResponsiveCard, ResponsiveButton } from '../components/ui/responsive-wrapper';
import { API_CONFIG } from '../config/api';
import { ArrowLeft, FileText, Calendar, Shield, Download } from 'lucide-react';

interface DocumentAnalysis {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  cvss_score: number;
  severity: string;
  vulnerability_types: string[];
  created_at: string;
  extracted_text_preview: string;
  recommendations: string[];
}

const DocumentAnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAnalyses();
  }, []);

  const fetchAllAnalyses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses);
      } else {
        setError('Failed to load document analyses');
      }
    } catch (error) {
      setError('Error loading document analyses');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ResponsiveWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </ResponsiveWrapper>
    );
  }

  if (error) {
    return (
      <ResponsiveWrapper>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <ResponsiveButton onClick={fetchAllAnalyses}>
            Try Again
          </ResponsiveButton>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <ResponsiveButton
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </ResponsiveButton>
            <ResponsiveButton
              onClick={() => navigate('/document-analyzer')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4" />
              New Analysis
            </ResponsiveButton>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Document Analysis History</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View and manage all your document analysis results
            </p>
          </div>
        </div>

        {/* Summary */}
        <ResponsiveCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 min-h-[100px] flex flex-col justify-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{analyses.length}</div>
                <div className="text-sm text-blue-700 font-medium break-words">Total Analyses</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 min-h-[100px] flex flex-col justify-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {analyses.filter(a => a.severity.toLowerCase() === 'critical').length}
                </div>
                <div className="text-sm text-red-700 font-medium break-words">Critical</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 min-h-[100px] flex flex-col justify-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {analyses.filter(a => a.severity.toLowerCase() === 'high').length}
                </div>
                <div className="text-sm text-orange-700 font-medium break-words">High</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 min-h-[100px] flex flex-col justify-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analyses.reduce((sum, a) => sum + a.vulnerability_types.length, 0)}
                </div>
                <div className="text-sm text-green-700 font-medium break-words">Total Vulnerabilities</div>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        {/* Analyses List */}
        <div className="space-y-4">
          {analyses.length === 0 ? (
            <ResponsiveCard>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No analyses found</h3>
                <p className="text-gray-600 mb-4">Start by analyzing your first document</p>
                <ResponsiveButton onClick={() => navigate('/document-analyzer')}>
                  Analyze Document
                </ResponsiveButton>
              </div>
            </ResponsiveCard>
          ) : (
            analyses.map((analysis) => (
              <ResponsiveCard key={analysis.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{analysis.filename}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
                          {analysis.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>{formatDate(analysis.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">CVSS: {analysis.cvss_score}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span>{formatFileSize(analysis.file_size)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vulnerabilities */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Detected Vulnerabilities
                    </h4>
                    {analysis.vulnerability_types.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.vulnerability_types.map((type, index) => (
                          <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <span className="text-green-700 text-sm font-medium">No specific vulnerabilities detected</span>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-yellow-500" />
                        Recommendations
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <ul className="text-sm text-gray-700 space-y-2">
                          {analysis.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-600 mt-1 font-bold">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                          {analysis.recommendations.length > 2 && (
                            <li className="text-yellow-700 text-xs font-medium pt-2 border-t border-yellow-300">
                              +{analysis.recommendations.length - 2} more recommendations
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Text Preview */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Text Preview
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 max-h-24 overflow-hidden leading-relaxed">
                        {analysis.extracted_text_preview}
                      </div>
                    </div>
                  </div>
                </div>
              </ResponsiveCard>
            ))
          )}
        </div>
      </div>
    </ResponsiveWrapper>
  );
};

export default DocumentAnalysisHistory;
