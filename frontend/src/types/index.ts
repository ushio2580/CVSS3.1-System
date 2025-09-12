// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: string;
}

export interface UserPermissions {
  can_create_vulnerabilities: boolean;
  can_edit_vulnerabilities: boolean;
  can_delete_vulnerabilities: boolean;
  can_manage_users: boolean;
  can_export: boolean;
  can_view_audit_logs: boolean;
  role: string;
}

// Vulnerability types
export interface Vulnerability {
  id: number;
  title: string;
  cve_id?: string;
  description?: string;
  vector?: string;
  base_score?: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Mitigating' | 'Fixed' | 'Accepted';
  source: 'internal' | 'nvd' | 'other';
  owner_id: number;
  created_at: string;
  updated_at: string;
}

// Evaluation types
export interface Evaluation {
  id: number;
  vuln_id: number;
  metrics: Record<string, string>;
  base_score: number;
  temporal_score?: number;
  environmental_score?: number;
  author_id: number;
  created_at: string;
  updated_at: string;
}

// CVSS Metrics
export interface CVSSMetrics {
  base_metrics: Record<string, string[]>;
  temporal_metrics: Record<string, string[]>;
  environmental_metrics: Record<string, string[]>;
}

// Dashboard types
export interface DashboardKPIs {
  total_vulnerabilities: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  recent_vulnerabilities: number;
}

export interface ChartData {
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  trend_data: Array<{
    date: string;
    count: number;
  }>;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
  charts: ChartData;
  top_vulnerabilities: Vulnerability[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  vulnerabilities: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'analyst' | 'viewer';
}

export interface VulnerabilityForm {
  title: string;
  cve_id?: string;
  description?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status?: 'Open' | 'Mitigating' | 'Fixed' | 'Accepted';
  source?: 'internal' | 'nvd' | 'other';
  vector?: string;
}

export interface EvaluationForm {
  metrics: Record<string, string>;
}

// Filter types
export interface VulnerabilityFilters {
  severity?: string;
  status?: string;
  source?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: UserPermissions | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterForm) => Promise<void>;
  isLoading: boolean;
}

// Theme types
export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

