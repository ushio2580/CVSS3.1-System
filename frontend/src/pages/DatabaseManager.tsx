import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Table as TableIcon, 
  Play, 
  Download, 
  Eye, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface DatabaseInfo {
  database_name: string;
  database_type: string;
  total_tables: number;
  tables: Array<{
    name: string;
    columns: number;
    indexes: number;
    foreign_keys: number;
    column_details: Array<{
      name: string;
      type: string;
      nullable: boolean;
      primary_key: boolean;
    }>;
  }>;
}

interface TableData {
  table_name: string;
  columns: string[];
  data: any[];
  row_count: number;
  execution_time: number;
  limit: number;
  offset: number;
}

interface QueryResult {
  success: boolean;
  result: any;
  execution_time: number;
  query_id: number;
}

export default function DatabaseManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryText, setQueryText] = useState<string>('');
  const [queryType, setQueryType] = useState<string>('SELECT');
  const [showTableStructure, setShowTableStructure] = useState<{[key: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);

  // Fetch database information
  const { data: dbInfo, isLoading: dbInfoLoading, error: dbInfoError } = useQuery({
    queryKey: ['database-info'],
    queryFn: () => apiService.getDatabaseInfo(),
    retry: false
  });

  // Handle database info errors
  React.useEffect(() => {
    if (dbInfoError) {
      const error = dbInfoError as any;
      if (error.message?.includes('403')) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to load database information');
      }
    }
  }, [dbInfoError]);

  // Fetch table data
  const { data: tableData, isLoading: tableDataLoading, refetch: refetchTableData } = useQuery({
    queryKey: ['table-data', selectedTable, currentPage, perPage],
    queryFn: () => apiService.getTableData(selectedTable, perPage, (currentPage - 1) * perPage),
    enabled: !!selectedTable,
    retry: false
  });

  // Fetch table count
  const { data: tableCount } = useQuery({
    queryKey: ['table-count', selectedTable],
    queryFn: () => apiService.getTableCount(selectedTable),
    enabled: !!selectedTable,
    retry: false
  });

  // Fetch query suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['query-suggestions'],
    queryFn: () => apiService.getQuerySuggestions(),
    retry: false
  });

  // Fetch query history
  const { data: queryHistory } = useQuery({
    queryKey: ['query-history', currentPage],
    queryFn: () => apiService.getQueryHistory(currentPage, 20),
    retry: false
  });

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: (data: { query: string; type: string }) => 
      apiService.executeQuery(data.query, data.type),
    onSuccess: (data: QueryResult) => {
      toast.success(`Query executed successfully in ${data.execution_time.toFixed(3)}s`);
      queryClient.invalidateQueries({ queryKey: ['query-history'] });
      if (data.result?.data) {
        // Show results in a modal or new tab
        console.log('Query results:', data.result);
      }
    },
    onError: (error: any) => {
      toast.error(`Query failed: ${error.message}`);
    }
  });

  const handleExecuteQuery = () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }
    executeQueryMutation.mutate({ query: queryText, type: queryType });
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQueryText(suggestion.query);
    setQueryType(suggestion.type);
  };

  const handleExportTable = async (tableName: string) => {
    try {
      const blob = await apiService.exportTableData(tableName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Table ${tableName} exported successfully`);
    } catch (error) {
      toast.error('Failed to export table');
    }
  };

  const toggleTableStructure = (tableName: string) => {
    setShowTableStructure(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getQueryTypeColor = (type: string) => {
    const colors = {
      'SELECT': 'bg-blue-100 text-blue-800',
      'INSERT': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (dbInfoLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Database Manager</h1>
              <p className="text-muted-foreground">Manage and query your database</p>
            </div>
          </div>
        </div>
        {dbInfo && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {dbInfo.database_type} - {dbInfo.database_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {dbInfo.total_tables} tables
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Database Overview</TabsTrigger>
          <TabsTrigger value="query">Query Editor</TabsTrigger>
          <TabsTrigger value="history">Query History</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        {/* Database Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbInfo?.tables?.map((table) => (
                  <Card key={table.name} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{table.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {table.columns} columns
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTableStructure(table.name)}
                        >
                          {showTableStructure[table.name] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline">{table.indexes} indexes</Badge>
                        <Badge variant="outline">{table.foreign_keys} FKs</Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedTable(table.name)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Data
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportTable(table.name)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Table Structure */}
                      {showTableStructure[table.name] && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Structure:</h4>
                          <div className="space-y-1">
                            {table.column_details.map((col) => (
                              <div key={col.name} className="flex justify-between text-sm">
                                <span className={col.primary_key ? 'font-semibold' : ''}>
                                  {col.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {col.type} {col.primary_key && '(PK)'} {!col.nullable && '(NOT NULL)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table Data Viewer */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Table: {selectedTable}</span>
                  <div className="flex items-center gap-2">
                    {tableCount && (
                      <Badge variant="outline">
                        {tableCount.count} total rows
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTable('')}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tableDataLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tableData?.data ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {tableData.data.length} rows (executed in {tableData.execution_time.toFixed(3)}s)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-1 text-sm">Page {currentPage}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={tableData.data.length < perPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {tableData.columns.map((col: string) => (
                              <TableHead key={col}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.data.map((row: any, index: number) => (
                            <TableRow key={index}>
                              {tableData.columns.map((col: string) => (
                                <TableCell key={col} className="max-w-xs truncate">
                                  {formatValue(row[col])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Query Editor Tab */}
        <TabsContent value="query" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Query Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Query Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={queryType} onValueChange={setQueryType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELECT">SELECT</SelectItem>
                        <SelectItem value="INSERT">INSERT</SelectItem>
                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleExecuteQuery}
                      disabled={executeQueryMutation.isPending}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {executeQueryMutation.isPending ? 'Executing...' : 'Execute Query'}
                    </Button>
                  </div>

                  <Textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="min-h-[200px] font-mono text-sm"
                  />

                  {executeQueryMutation.data && (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Query Results</h4>
                        <Badge className={getQueryTypeColor(queryType)}>
                          {queryType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Executed in {executeQueryMutation.data.execution_time.toFixed(3)}s
                      </p>
                      {executeQueryMutation.data.result?.data ? (
                        <div className="border rounded overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {executeQueryMutation.data.result.columns.map((col: string) => (
                                  <TableHead key={col}>{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {executeQueryMutation.data.result.data.slice(0, 10).map((row: any, index: number) => (
                                <TableRow key={index}>
                                  {executeQueryMutation.data.result.columns.map((col: string) => (
                                    <TableCell key={col} className="max-w-xs truncate">
                                      {formatValue(row[col])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {executeQueryMutation.data.result.data.length > 10 && (
                            <p className="text-sm text-muted-foreground p-2 text-center">
                              Showing first 10 rows of {executeQueryMutation.data.result.data.length} results
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">
                          {executeQueryMutation.data.result?.affected_rows || 0} rows affected
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Query Suggestions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Query Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suggestions?.suggestions?.map((suggestion: any, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Query History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query History</CardTitle>
            </CardHeader>
            <CardContent>
              {queryHistory?.queries ? (
                <div className="space-y-4">
                  {queryHistory.queries.map((query: any) => (
                    <Card key={query.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getQueryTypeColor(query.query_type)}>
                              {query.query_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {query.username}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(query.timestamp).toLocaleString()}
                            </span>
                            {query.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="font-mono text-sm bg-muted p-2 rounded">
                            {query.query_text}
                          </div>
                          {query.execution_time && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Execution time: {query.execution_time.toFixed(3)}s
                            </p>
                          )}
                          {query.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">{query.error_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No query history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <UserManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// User Management Component
function UserManagementTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer'
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'viewer'
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getAllUsers(),
    retry: false
  });

  // Debug users data
  React.useEffect(() => {
    console.log('Users data:', usersData);
    console.log('Users loading:', usersLoading);
    console.log('Users error:', usersError);
  }, [usersData, usersLoading, usersError]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiService.createUser(userData),
    onSuccess: () => {
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'viewer' });
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message}`);
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: any }) => 
      apiService.updateUser(userId, userData),
    onSuccess: () => {
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiService.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  });

  const handleCreateUser = () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editForm.name || !editForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateUserMutation.mutate({
      userId: selectedUser.id,
      userData: editForm
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'analyst': 'bg-blue-100 text-blue-800',
      'viewer': 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={updateUserMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
