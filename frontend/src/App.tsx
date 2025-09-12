import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Dashboard } from '@/pages/Dashboard';
import { Vulnerabilities } from '@/pages/Vulnerabilities';
import { Login } from '@/pages/Login';
import AuditLogs from '@/pages/AuditLogs';
import VulnerabilityHistory from '@/pages/VulnerabilityHistory';
import DatabaseManager from '@/pages/DatabaseManager';
import DocumentAnalyzer from '@/components/DocumentAnalyzer';
import DocumentAnalysisHistory from '@/pages/DocumentAnalysisHistory';
import { Toaster } from 'sonner';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vulnerabilities" 
        element={
          <ProtectedRoute>
            <Vulnerabilities />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit-logs" 
        element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vulnerability/:vulnId/history" 
        element={
          <ProtectedRoute>
            <VulnerabilityHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/database-manager" 
        element={
          <ProtectedRoute>
            <DatabaseManager />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/document-analyzer" 
        element={
          <ProtectedRoute>
            <DocumentAnalyzer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/document-analysis-history" 
        element={
          <ProtectedRoute>
            <DocumentAnalysisHistory />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
            <Toaster 
              position="top-right" 
              richColors 
              duration={4000}
              closeButton={true}
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
