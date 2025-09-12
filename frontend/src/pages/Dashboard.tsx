import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Download,
  Moon,
  Sun,
  Search,
  Filter,
  LogOut,
  List,
  Upload,
  Activity,
  Database,
  FileSearch
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { KPICard } from '@/components/Dashboard/KPICard';
import { SeverityChart } from '@/components/Dashboard/SeverityChart';
import { TrendChart } from '@/components/Dashboard/TrendChart';
import { CVSSCalculator } from '@/components/CVSSCalculator';
import { AddVulnerabilityModal } from '@/components/AddVulnerabilityModal';
import { EditVulnerabilityModal } from '@/components/EditVulnerabilityModal';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import DocumentAnalysisCard from '../components/Dashboard/DocumentAnalysisCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatScore, getSeverityColor, getStatusColor } from '../utils';
import { Vulnerability } from '@/types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, permissions, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => apiService.getDashboardSummary(days),
  });

  const handleExportCSV = async () => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Generating professional CSV report...');
      const blob = await apiService.exportVulnerabilitiesCSV();
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
      console.error('Export failed:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Generating professional PDF report...');
      const blob = await apiService.exportVulnerabilitiesPDF();
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
      console.error('Export failed:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleEditVulnerability = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsEditModalOpen(true);
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
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 glass border-b"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">CVSS Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="glass"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <div className="flex space-x-2">
                {permissions?.can_create_vulnerabilities && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                      className="glass"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Add Vulnerability
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBulkUploadModalOpen(true)}
                      className="glass"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="glass"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="glass"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/vulnerabilities')}
                  className="glass"
                >
                  <List className="h-4 w-4 mr-2" />
                  All Vulnerabilities
                </Button>
                {permissions?.can_view_audit_logs && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/audit-logs')}
                    className="glass"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                )}
                {user?.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/database-manager')}
                    className="glass"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Database Manager
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/document-analyzer')}
                  className="glass"
                >
                  <FileSearch className="h-4 w-4 mr-2" />
                  Document Analyzer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="glass"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* KPIs */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          <KPICard
            title="Total Vulnerabilities"
            value={dashboardData?.kpis.total_vulnerabilities || 0}
            icon={<Shield className="h-4 w-4" />}
          />
          <KPICard
            title="Critical"
            value={dashboardData?.kpis.critical_vulnerabilities || 0}
            className="border-red-200 dark:border-red-800"
            icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          />
          <KPICard
            title="High"
            value={dashboardData?.kpis.high_vulnerabilities || 0}
            className="border-orange-200 dark:border-orange-800"
            icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
          />
          <KPICard
            title="Recent (30 days)"
            value={dashboardData?.kpis.recent_vulnerabilities || 0}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </motion.div>

        {/* Charts and Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SeverityChart data={dashboardData?.charts.severity_distribution || {}} />
          <TrendChart data={dashboardData?.charts.trend_data || []} />
          <CVSSCalculator />
        </div>

        {/* Document Analysis Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <DocumentAnalysisCard />
        </motion.div>

        {/* Top Vulnerabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Top Vulnerabilities by Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.top_vulnerabilities.map((vuln: Vulnerability, index: number) => (
                  <motion.div
                    key={vuln.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{vuln.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vuln.cve_id || 'No CVE ID'} • {formatDate(vuln.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity}
                      </Badge>
                      <Badge className={getStatusColor(vuln.status)}>
                        {vuln.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatScore(vuln.base_score)}
                        </div>
                        <div className="text-xs text-muted-foreground">CVSS Score</div>
                      </div>
                      {permissions?.can_edit_vulnerabilities && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVulnerability(vuln)}
                          className="ml-2"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Add Vulnerability Modal */}
      <AddVulnerabilityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refetch dashboard data
          refetch();
          setIsAddModalOpen(false);
          toast.success('Vulnerability added successfully!');
        }}
      />

      {/* Edit Vulnerability Modal */}
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

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsBulkUploadModalOpen(false);
        }}
      />
    </div>
  );
};
