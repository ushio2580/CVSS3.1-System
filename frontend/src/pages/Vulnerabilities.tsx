import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  FileText,
  Eye,
  History,
  TrendingUp,
  Upload
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddVulnerabilityModal } from '@/components/AddVulnerabilityModal';
import { EditVulnerabilityModal } from '@/components/EditVulnerabilityModal';
import { VulnerabilityEvaluations } from '@/components/VulnerabilityEvaluations';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import { formatDate, formatScore, getSeverityColor, getStatusColor } from '../utils';
import { Vulnerability } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const Vulnerabilities: React.FC = () => {
  const { permissions } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [selectedVulnForEvaluations, setSelectedVulnForEvaluations] = useState<number | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const { data: vulnerabilitiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['vulnerabilities', search, severityFilter, statusFilter, sourceFilter, page],
    queryFn: () => apiService.getVulnerabilities({
      search,
      severity: severityFilter || undefined,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      page,
      per_page: 20
    }),
  });

  const handleEditVulnerability = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsEditModalOpen(true);
  };

  const handleDeleteVulnerability = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vulnerability?')) return;
    
    try {
      await apiService.deleteVulnerability(id);
      toast.success('Vulnerability deleted successfully!');
      refetch();
    } catch (error) {
      toast.error('Failed to delete vulnerability');
    }
  };

  const handleExportCSV = async () => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Generating professional CSV report...');
      const blob = await apiService.exportVulnerabilitiesCSV({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
      });
      toast.dismiss(loadingToast);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CVSS_Vulnerability_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Professional CSV report exported successfully!');
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Generating professional PDF report...');
      const blob = await apiService.exportVulnerabilitiesPDF({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
      });
      toast.dismiss(loadingToast);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CVSS_Vulnerability_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Professional PDF report exported successfully!');
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Export failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading vulnerabilities</h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  const vulnerabilities = vulnerabilitiesData?.vulnerabilities || [];
  const pagination = vulnerabilitiesData?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vulnerabilities</h1>
            <p className="text-muted-foreground">
              Manage and track all vulnerabilities
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            {permissions?.can_create_vulnerabilities && (
              <>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vulnerability
                </Button>
                <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vulnerabilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="p-2 border rounded-md bg-background"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-md bg-background"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Mitigating">Mitigating</option>
                <option value="Fixed">Fixed</option>
                <option value="Accepted">Accepted</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="p-2 border rounded-md bg-background"
              >
                <option value="">All Sources</option>
                <option value="internal">Internal</option>
                <option value="nvd">NVD</option>
                <option value="other">Other</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setSeverityFilter('');
                  setStatusFilter('');
                  setSourceFilter('');
                  setPage(1);
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vulnerabilities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {vulnerabilities.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No vulnerabilities found</p>
            </CardContent>
          </Card>
        ) : (
          vulnerabilities.map((vuln: Vulnerability, index: number) => (
            <motion.div
              key={vuln.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold">{vuln.title}</h3>
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                        <Badge className={getStatusColor(vuln.status)}>
                          {vuln.status}
                        </Badge>
                        <Badge variant="outline">
                          {vuln.source}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {vuln.cve_id || 'No CVE ID'} • {formatDate(vuln.created_at)}
                      </p>
                      {vuln.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {vuln.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-semibold">
                          CVSS Score: {formatScore(vuln.base_score)}
                        </span>
                        {vuln.vector && (
                          <span className="text-muted-foreground font-mono text-xs">
                            {vuln.vector}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVulnForEvaluations(vuln.id)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Evaluations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vulnerability/${vuln.id}/history`)}
                      >
                        <History className="w-4 h-4 mr-2" />
                        History
                      </Button>
                      {permissions?.can_edit_vulnerabilities && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVulnerability(vuln)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {permissions?.can_delete_vulnerabilities && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVulnerability(vuln.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-8"
        >
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={!pagination.has_prev}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.has_next}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <AddVulnerabilityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
          toast.success('Vulnerability added successfully!');
        }}
      />

      <EditVulnerabilityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVulnerability(null);
        }}
        onSuccess={() => {
          refetch();
          setIsEditModalOpen(false);
          setSelectedVulnerability(null);
          toast.success('Vulnerability updated successfully!');
        }}
        vulnerability={selectedVulnerability}
      />

      {/* Evaluations Modal */}
      {selectedVulnForEvaluations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <VulnerabilityEvaluations
              vulnId={selectedVulnForEvaluations}
              onEvaluationCreated={() => {
                // Optionally refresh data or show success message
              }}
            />
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSelectedVulnForEvaluations(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsBulkUploadModalOpen(false);
          toast.success('Bulk upload completed successfully!');
        }}
      />
    </div>
  );
};
