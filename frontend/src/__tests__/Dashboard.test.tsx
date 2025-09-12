/**
 * Real tests for Dashboard component
 * These tests cover the actual Dashboard component functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock the API service
jest.mock('../services/api', () => ({
  getVulnerabilities: jest.fn(() => Promise.resolve({
    data: [
      { id: 1, title: 'Test Vulnerability', cvss_score: 8.5, severity: 'High' },
      { id: 2, title: 'Another Vulnerability', cvss_score: 6.2, severity: 'Medium' }
    ]
  })),
  getDashboardStats: jest.fn(() => Promise.resolve({
    data: {
      total_vulnerabilities: 45,
      high_severity: 12,
      medium_severity: 20,
      low_severity: 13
    }
  }))
}));

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with main elements', async () => {
    renderWithRouter(<Dashboard />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/CVSS Scoring System/i)).toBeInTheDocument();
    });
  });

  test('displays vulnerability statistics', async () => {
    renderWithRouter(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Total Vulnerabilities/i)).toBeInTheDocument();
      expect(screen.getByText(/High Severity/i)).toBeInTheDocument();
      expect(screen.getByText(/Medium Severity/i)).toBeInTheDocument();
      expect(screen.getByText(/Low Severity/i)).toBeInTheDocument();
    });
  });

  test('shows recent vulnerabilities', async () => {
    renderWithRouter(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Recent Vulnerabilities/i)).toBeInTheDocument();
    });
  });

  test('displays severity chart', async () => {
    renderWithRouter(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Severity Distribution/i)).toBeInTheDocument();
    });
  });

  test('shows trend chart', async () => {
    renderWithRouter(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Vulnerability Trends/i)).toBeInTheDocument();
    });
  });
});
