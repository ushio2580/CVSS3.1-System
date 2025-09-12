// API Configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to production URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://cvss-scoring-system.onrender.com/api',
  TIMEOUT: 10000,
};

export default API_CONFIG;
