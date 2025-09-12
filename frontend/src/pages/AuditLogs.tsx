import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Calendar, Download, Filter, Search, Eye, AlertCircle, CheckCircle, Activity, X, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number;
  username: string;
  action: string;
  target_type: string;
  target_id: number | null;
  target_name: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
}

interface AuditSummary {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  statistics: {
    total_actions: number;
    successful_actions: number;
    failed_actions: number;
    success_rate: number;
  };
  top_actions: Array<{ action: string; count: number }>;
  top_target_types: Array<{ type: string; count: number }>;
  top_users: Array<{ username: string; count: number }>;
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function AuditLogs() {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    action: '',
    target_type: '',
    username: '',
    start_date: '',
    end_date: '',
    success: '',
    page: 1,
    per_page: 50
  });

  const [availableFilters, setAvailableFilters] = useState({
    actions: [],
    target_types: [],
    usernames: []
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch available filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['audit-filters'],
    queryFn: async () => {
      return await apiService.getAuditFilters();
    },
    enabled: true
  });

  // Fetch audit logs
  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const result = await apiService.getAuditLogs(filters);
      console.log('Audit logs response:', result);
      return result;
    },
    enabled: true
  });

  // Fetch audit summary
  const { data: summaryData } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: async () => {
      return await apiService.getAuditSummary(30);
    },
    enabled: true
  });

  useEffect(() => {
    if (filterOptions) {
      setAvailableFilters(filterOptions);
    }
  }, [filterOptions]);

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" to empty string for backend compatibility
    const backendValue = value === 'all' ? '' : value;
    console.log(`Filter change: ${key} = ${value} -> ${backendValue}`);
    setFilters(prev => ({
      ...prev,
      [key]: backendValue,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const exportLogs = async () => {
    try {
      const exportFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.per_page;

      const blob = await apiService.exportAuditLogs(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTargetTypeColor = (type: string) => {
    const colors = {
      vulnerability: 'bg-orange-100 text-orange-800',
      user: 'bg-blue-100 text-blue-800',
      evaluation: 'bg-green-100 text-green-800',
      bulk_upload: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedLog(null);
    setShowDetailsModal(false);
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>Error loading audit logs</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
        </div>
        <Button onClick={exportLogs} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold">{summaryData.statistics.total_actions}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{summaryData.statistics.success_rate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Actions</p>
                  <p className="text-2xl font-bold">{summaryData.statistics.failed_actions}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="text-2xl font-bold">{summaryData.period.days} days</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {availableFilters.actions.map((action: string) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_type">Target Type</Label>
              <Select value={filters.target_type || 'all'} onValueChange={(value) => handleFilterChange('target_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {availableFilters.target_types.map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Select value={filters.username || 'all'} onValueChange={(value) => handleFilterChange('username', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {availableFilters.usernames.map((username: string) => (
                    <SelectItem key={username} value={username}>{username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="success">Status</Label>
              <Select value={filters.success || 'all'} onValueChange={(value) => handleFilterChange('success', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {console.log('Audit data in render:', auditData)}
              {console.log('Audit logs array:', auditData?.logs)}
              {console.log('Number of logs:', auditData?.logs?.length)}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData?.logs?.map((log: AuditLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.username}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={getTargetTypeColor(log.target_type)}>
                            {log.target_type}
                          </Badge>
                          {log.target_name && (
                            <span className="text-sm text-muted-foreground">
                              {log.target_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => showLogDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {auditData?.pagination && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(auditData.pagination.page - 1)}
                          className={!auditData.pagination.has_prev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: auditData.pagination.pages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === auditData.pagination.page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(auditData.pagination.page + 1)}
                          className={!auditData.pagination.has_next ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Showing {((auditData.pagination.page - 1) * auditData.pagination.per_page) + 1} to{' '}
                    {Math.min(auditData.pagination.page * auditData.pagination.per_page, auditData.pagination.total)} of{' '}
                    {auditData.pagination.total} entries
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Audit Log Details</h3>
              <Button variant="ghost" size="sm" onClick={closeDetailsModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Timestamp</Label>
                  <p className="text-sm">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User</Label>
                  <p className="text-sm">{selectedLog.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Action</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Target Type</Label>
                  <Badge className={getTargetTypeColor(selectedLog.target_type)}>
                    {selectedLog.target_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  {selectedLog.success ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Target Information */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Target Information</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  {selectedLog.target_id ? (
                    <p className="text-sm"><span className="font-medium">ID:</span> {selectedLog.target_id}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No target ID available</p>
                  )}
                  {selectedLog.target_name ? (
                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedLog.target_name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No target name available</p>
                  )}
                </div>
              </div>

              {/* Details */}
              {selectedLog.details ? (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-muted-foreground">No additional details available for this action.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.error_message ? (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Error Message</Label>
                  <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400">{selectedLog.error_message}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Error Message</Label>
                  <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-sm text-green-700 dark:text-green-400">No errors occurred during this action.</p>
                  </div>
                </div>
              )}

              {/* Action Context */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Action Context</Label>
                <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Action:</span> {selectedLog.action}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Target Type:</span> {selectedLog.target_type}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">User:</span> {selectedLog.username} {selectedLog.user_id && `(ID: ${selectedLog.user_id})`}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Timestamp:</span> {formatTimestamp(selectedLog.timestamp)}
                  </p>
                </div>
              </div>

              {/* Technical Information */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Technical Information</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md space-y-2">
                  <p className="text-sm"><span className="font-medium">IP Address:</span> {selectedLog.ip_address || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">User Agent:</span></p>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={closeDetailsModal}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


