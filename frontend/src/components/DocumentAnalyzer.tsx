import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveWrapper, ResponsiveCard, ResponsiveButton } from './ui/responsive-wrapper';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { API_CONFIG } from '../config/api';

interface DocumentAnalysisResult {
  filename: string;
  file_size: number;
  text_length: number;
  analysis: {
    vulnerability_types: string[];
    severity: string;
    cvss_components: {
      attack_vector: string;
      attack_complexity: string;
      privileges_required: string;
      user_interaction: string;
      scope: string;
      confidentiality: string;
      integrity: string;
      availability: string;
    };
  };
  cvss_score: number;
  severity: string;
  recommendations: string[];
  extracted_text_preview: string;
}

interface SupportedFormats {
  supported_formats: string[];
  max_file_size_mb: number;
  description: string;
}

const DocumentAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<SupportedFormats | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar formatos soportados al montar el componente
  React.useEffect(() => {
    fetchSupportedFormats();
  }, []);

  const fetchSupportedFormats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/supported-formats`);
      if (response.ok) {
        const data = await response.json();
        setSupportedFormats(data);
      }
    } catch (error) {
      console.error('Error fetching supported formats:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
        // Verificar si se guardó en la base de datos
        if (data.result.analysis_id) {
          setSavedToDatabase(true);
        } else if (data.result.db_save_error) {
          setSavedToDatabase(false);
        }
      } else {
        setError(data.error || 'Error analyzing document');
      }
    } catch (error) {
      setError('Connection error while analyzing document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSavedToDatabase(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvertToVulnerability = async () => {
    if (!result) return;

    setIsConverting(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vulns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: `Document Analysis: ${result.filename}`,
          description: `Vulnerability detected in document analysis:\n\n${result.extracted_text_preview}`,
          severity: result.severity.charAt(0).toUpperCase() + result.severity.slice(1).toLowerCase(),
          status: 'Open',
          source: 'external',
          cvss_score: result.cvss_score,
          recommendations: result.recommendations.join('\n\n')
        }),
      });

      if (response.ok) {
        alert('Vulnerability added to dashboard successfully!');
        // Optionally navigate to vulnerabilities page
        // navigate('/vulnerabilities');
      } else {
        const errorData = await response.json();
        alert(`Error adding vulnerability: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error converting to vulnerability');
    } finally {
      setIsConverting(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-red-600';
    if (score >= 7.0) return 'text-orange-600';
    if (score >= 4.0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const translateVulnerabilityType = (type: string) => {
    const translations: { [key: string]: string } = {
      'sql_injection': 'Inyección SQL',
      'xss': 'Cross-Site Scripting (XSS)',
      'csrf': 'Cross-Site Request Forgery (CSRF)',
      'authentication': 'Bypass de Autenticación',
      'authorization': 'Bypass de Autorización',
      'injection': 'Inyección de Código',
      'crypto': 'Vulnerabilidades Criptográficas',
      'network': 'Vulnerabilidades de Red'
    };
    return translations[type] || type;
  };

  const translateCvssComponent = (component: string, value: string) => {
    const translations: { [key: string]: { [key: string]: string } } = {
      'attack_vector': {
        'network': 'Network',
        'adjacent': 'Adjacent',
        'local': 'Local',
        'physical': 'Physical'
      },
      'attack_complexity': {
        'low': 'Low',
        'high': 'High'
      },
      'privileges_required': {
        'none': 'None',
        'low': 'Low',
        'high': 'High'
      },
      'user_interaction': {
        'none': 'None',
        'required': 'Required'
      },
      'scope': {
        'unchanged': 'Unchanged',
        'changed': 'Changed'
      },
      'confidentiality': {
        'none': 'None',
        'low': 'Low',
        'high': 'High'
      },
      'integrity': {
        'none': 'None',
        'low': 'Low',
        'high': 'High'
      },
      'availability': {
        'none': 'None',
        'low': 'Low',
        'high': 'High'
      }
    };
    return translations[component]?.[value] || value;
  };

  if (!user) {
    return (
      <ResponsiveWrapper>
        <div className="text-center py-8">
          <p className="text-gray-600">Please log in to access the document analyzer.</p>
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
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Document Analyzer
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload PDF or Word documents to automatically detect vulnerabilities and generate CVSS scores
            </p>
          </div>
        </div>

        {/* Supported Formats */}
        {supportedFormats && (
          <ResponsiveCard>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Supported Formats</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {supportedFormats.supported_formats.map((format) => (
                  <span key={format} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    .{format.toUpperCase()}
                  </span>
                ))}
              </div>
              <p className="text-sm text-blue-700">
                Maximum size: {supportedFormats.max_file_size_mb}MB
              </p>
            </div>
          </ResponsiveCard>
        )}

        {/* Upload Section */}
        <ResponsiveCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Document</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    {' '}or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX up to {supportedFormats?.max_file_size_mb || 16}MB
                  </p>
                </div>
              </label>
            </div>

            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <ResponsiveButton
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze Document'
                )}
              </ResponsiveButton>
            </div>
          </div>
        </ResponsiveCard>

        {/* Error Display */}
        {error && (
          <ResponsiveCard>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </ResponsiveCard>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <ResponsiveCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Summary</h2>
                <div className="flex items-center gap-3">
                  {savedToDatabase && (
                    <div className="flex items-center text-green-600 text-sm">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Saved to database
                    </div>
                  )}
                  <ResponsiveButton
                    onClick={handleConvertToVulnerability}
                    disabled={isConverting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConverting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add to Dashboard'
                    )}
                  </ResponsiveButton>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-lg font-semibold text-blue-900 mb-2">File</div>
                  <div className="text-sm text-blue-700 break-words">{result.filename}</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-3xl font-bold text-orange-900 mb-2">{result.cvss_score}</div>
                  <div className="text-sm text-orange-700 font-medium">CVSS Score</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <div className={`text-2xl font-bold ${getSeverityColor(result.severity).split(' ')[0]} mb-2`}>
                    {result.severity.toUpperCase()}
                  </div>
                  <div className="text-sm text-red-700 font-medium">Severity</div>
                </div>
              </div>
            </ResponsiveCard>

            {/* Vulnerabilities Detected */}
            <ResponsiveCard>
              <h2 className="text-xl font-semibold mb-4">Detected Vulnerabilities</h2>
              {result.analysis.vulnerability_types.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.analysis.vulnerability_types.map((type, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-red-800">
                          {translateVulnerabilityType(type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No specific vulnerabilities detected</p>
                </div>
              )}
            </ResponsiveCard>

            {/* CVSS Components */}
            <ResponsiveCard>
              <h2 className="text-xl font-semibold mb-4">CVSS Components</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(result.analysis.cvss_components).map(([component, value]) => (
                  <div key={component} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl min-h-[80px] flex flex-col justify-center">
                    <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1 break-words">
                      {component.replace('_', ' ')}
                    </div>
                    <div className="text-base font-bold text-blue-800 break-words leading-tight">
                      {translateCvssComponent(component, value)}
                    </div>
                  </div>
                ))}
              </div>
            </ResponsiveCard>

            {/* Recommendations */}
            <ResponsiveCard>
              <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <svg className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800">{recommendation}</span>
                  </div>
                ))}
              </div>
            </ResponsiveCard>

            {/* Text Preview */}
            <ResponsiveCard>
              <h2 className="text-xl font-semibold mb-4">Extracted Text Preview</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {result.extracted_text_preview}
                </pre>
              </div>
            </ResponsiveCard>
          </div>
        )}
      </div>
    </ResponsiveWrapper>
  );
};

export default DocumentAnalyzer;
