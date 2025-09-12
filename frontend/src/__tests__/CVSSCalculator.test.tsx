/**
 * Real tests for CVSSCalculator component
 * These tests cover the actual CVSSCalculator component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CVSSCalculator from '../components/CVSSCalculator';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CVSSCalculator Component', () => {
  test('renders CVSS calculator form', () => {
    renderWithRouter(<CVSSCalculator />);
    
    expect(screen.getByText(/CVSS Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Attack Vector/i)).toBeInTheDocument();
    expect(screen.getByText(/Attack Complexity/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidentiality/i)).toBeInTheDocument();
    expect(screen.getByText(/Integrity/i)).toBeInTheDocument();
    expect(screen.getByText(/Availability/i)).toBeInTheDocument();
  });

  test('calculates CVSS score correctly', async () => {
    renderWithRouter(<CVSSCalculator />);
    
    // Select high severity options
    const attackVectorSelect = screen.getByLabelText(/Attack Vector/i);
    const attackComplexitySelect = screen.getByLabelText(/Attack Complexity/i);
    const confidentialitySelect = screen.getByLabelText(/Confidentiality/i);
    const integritySelect = screen.getByLabelText(/Integrity/i);
    const availabilitySelect = screen.getByLabelText(/Availability/i);
    
    fireEvent.change(attackVectorSelect, { target: { value: 'N' } });
    fireEvent.change(attackComplexitySelect, { target: { value: 'L' } });
    fireEvent.change(confidentialitySelect, { target: { value: 'H' } });
    fireEvent.change(integritySelect, { target: { value: 'H' } });
    fireEvent.change(availabilitySelect, { target: { value: 'H' } });
    
    const calculateButton = screen.getByText(/Calculate CVSS/i);
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/CVSS Score/i)).toBeInTheDocument();
      expect(screen.getByText(/9.8/i)).toBeInTheDocument();
      expect(screen.getByText(/Critical/i)).toBeInTheDocument();
    });
  });

  test('displays CVSS vector correctly', async () => {
    renderWithRouter(<CVSSCalculator />);
    
    // Fill form with specific values
    const attackVectorSelect = screen.getByLabelText(/Attack Vector/i);
    fireEvent.change(attackVectorSelect, { target: { value: 'N' } });
    
    const calculateButton = screen.getByText(/Calculate CVSS/i);
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/CVSS:3.1\/AV:N/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', () => {
    renderWithRouter(<CVSSCalculator />);
    
    const calculateButton = screen.getByText(/Calculate CVSS/i);
    fireEvent.click(calculateButton);
    
    expect(screen.getByText(/Please fill all required fields/i)).toBeInTheDocument();
  });

  test('resets form correctly', () => {
    renderWithRouter(<CVSSCalculator />);
    
    const attackVectorSelect = screen.getByLabelText(/Attack Vector/i);
    fireEvent.change(attackVectorSelect, { target: { value: 'N' } });
    
    const resetButton = screen.getByText(/Reset/i);
    fireEvent.click(resetButton);
    
    expect(attackVectorSelect).toHaveValue('');
  });
});