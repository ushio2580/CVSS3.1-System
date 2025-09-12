import { 
  User, 
  Vulnerability, 
  Evaluation, 
  DashboardSummary, 
  CVSSMetrics,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  VulnerabilityForm,
  EvaluationForm,
  VulnerabilityFilters,
  UserPermissions
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('API Request:', `${API_BASE_URL}${endpoint}`);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Headers:', config.headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterForm): Promise<{ message: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request('/auth/profile');
  }

  async getPermissions(): Promise<UserPermissions> {
    return this.request('/auth/permissions');
  }

  async updateProfile(userData: Partial<User>): Promise<{ message: string; user: User }> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Vulnerability endpoints
  async getVulnerabilities(filters: VulnerabilityFilters = {}): Promise<PaginatedResponse<Vulnerability>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request(`/vulns/?${params.toString()}`);
  }

  async getVulnerability(id: number): Promise<{ vulnerability: Vulnerability; evaluations: Evaluation[] }> {
    return this.request(`/vulns/${id}`);
  }

  async createVulnerability(data: VulnerabilityForm): Promise<{ message: string; vulnerability: Vulnerability }> {
    return this.request('/vulns/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVulnerability(id: number, data: Partial<VulnerabilityForm>): Promise<{ message: string; vulnerability: Vulnerability }> {
    return this.request(`/vulns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVulnerability(id: number): Promise<{ message: string }> {
    return this.request(`/vulns/${id}`, {
      method: 'DELETE',
    });
  }

  async createEvaluation(vulnId: number, data: EvaluationForm): Promise<{ message: string; evaluation: Evaluation; scores: any }> {
    return this.request(`/vulns/${vulnId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculateCVSS(data: { vector?: string; metrics?: Record<string, string> }): Promise<{ vector: string; metrics: Record<string, string>; scores: any }> {
    return this.request('/vulns/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoints
  async getDashboardSummary(days: number = 30): Promise<DashboardSummary> {
    return this.request(`/dashboard/summary?days=${days}`);
  }

  async getAnalytics(filters: VulnerabilityFilters = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request(`/dashboard/analytics?${params.toString()}`);
  }

  async getCVSSMetrics(): Promise<CVSSMetrics> {
    return this.request('/dashboard/metrics');
  }

  // Export endpoints
  async exportCSV(filters: VulnerabilityFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/csv?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async exportPDF(filters: VulnerabilityFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/pdf?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async exportEvaluationsCSV(vulnId?: number): Promise<Blob> {
    const params = new URLSearchParams();
    if (vulnId) {
      params.append('vuln_id', vulnId.toString());
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/evaluations/csv?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Bulk upload endpoints
  async bulkUpload(formData: FormData): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/bulk/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async downloadTemplate(): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/bulk/template`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnerability_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async validateFile(formData: FormData): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/bulk/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Audit endpoints
  async getAuditLogs(filters: any = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request(`/audit/logs?${params.toString()}`);
  }

  async getAuditSummary(days: number = 30): Promise<any> {
    return this.request(`/audit/logs/summary?days=${days}`);
  }

  async getAuditFilters(): Promise<any> {
    return this.request('/audit/logs/actions');
  }

  async exportAuditLogs(filters: any = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/audit/logs/export?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Vulnerability History endpoints
  async getVulnerabilityHistory(vulnId: number, filters: any = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request(`/history/vulnerability/${vulnId}/history?${params.toString()}`);
  }

  async getVulnerabilityHistorySummary(vulnId: number, days: number = 30): Promise<any> {
    return this.request(`/history/vulnerability/${vulnId}/history/summary?days=${days}`);
  }

  async getVulnerabilityHistoryFilters(vulnId: number): Promise<any> {
    return this.request(`/history/vulnerability/${vulnId}/history/actions`);
  }

  async exportVulnerabilityHistory(vulnId: number, filters: any = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/history/vulnerability/${vulnId}/history/export?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Database Manager endpoints
  async getDatabaseInfo(): Promise<any> {
    return this.request('/database/info');
  }

  async getTableStructure(tableName: string): Promise<any> {
    return this.request(`/database/tables/${tableName}/structure`);
  }

  async getTableData(tableName: string, limit: number = 100, offset: number = 0): Promise<any> {
    return this.request(`/database/tables/${tableName}/data?limit=${limit}&offset=${offset}`);
  }

  async getTableCount(tableName: string): Promise<any> {
    return this.request(`/database/tables/${tableName}/count`);
  }

  async executeQuery(query: string, type: string = 'SELECT'): Promise<any> {
    return this.request('/database/execute', {
      method: 'POST',
      body: JSON.stringify({ query, type }),
    });
  }

  async getQuerySuggestions(): Promise<any> {
    return this.request('/database/suggestions');
  }

  async getQueryHistory(page: number = 1, perPage: number = 50): Promise<any> {
    return this.request(`/database/queries?page=${page}&per_page=${perPage}`);
  }

  async getQueryDetails(queryId: number): Promise<any> {
    return this.request(`/database/queries/${queryId}`);
  }

  async exportTableData(tableName: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/database/export/${tableName}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // User Management endpoints
  async createUser(userData: { name: string; email: string; password: string; role: string }): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: Partial<{ name: string; email: string; role: string }>): Promise<any> {
    return this.request(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAllUsers(): Promise<any> {
    return this.request('/auth/users');
  }

  async getUserById(userId: number): Promise<any> {
    return this.request(`/auth/users/${userId}`);
  }

  // Professional Export functions
  async exportVulnerabilitiesCSV(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/csv?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export CSV');
    return response.blob();
  }

  async exportVulnerabilitiesPDF(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/pdf?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export PDF');
    return response.blob();
  }

  async exportAuditLogsCSV(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/audit/csv?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export audit CSV');
    return response.blob();
  }

  async exportAuditLogsPDF(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/export/audit/pdf?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export audit PDF');
    return response.blob();
  }

  // Evaluation endpoints
  async getVulnerabilityEvaluations(vulnId: number): Promise<any> {
    return this.request(`/evaluations/vulnerability/${vulnId}`);
  }

  async getEvaluation(evaluationId: number): Promise<any> {
    return this.request(`/evaluations/${evaluationId}`);
  }

  async updateEvaluation(evaluationId: number, evaluationData: any): Promise<any> {
    return this.request(`/evaluations/${evaluationId}`, {
      method: 'PUT',
      body: JSON.stringify(evaluationData),
    });
  }

  async deleteEvaluation(evaluationId: number): Promise<any> {
    return this.request(`/evaluations/${evaluationId}`, {
      method: 'DELETE',
    });
  }

  async getLatestEvaluation(vulnId: number): Promise<any> {
    return this.request(`/evaluations/vulnerability/${vulnId}/latest`);
  }
}

export const apiService = new ApiService();

