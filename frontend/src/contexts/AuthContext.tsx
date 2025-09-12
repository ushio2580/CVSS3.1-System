import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, LoginForm, RegisterForm, UserPermissions } from '@/types';
import { apiService } from '@/services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const [profileResponse, permissionsResponse] = await Promise.all([
            apiService.getProfile(),
            apiService.getPermissions()
          ]);
          setUser(profileResponse.user);
          setPermissions(permissionsResponse);
        } catch (error) {
          console.error('Failed to get user profile or permissions:', error);
          localStorage.removeItem('token');
          setToken(null);
          setPermissions(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      await apiService.register(userData);
      // Optionally auto-login after registration
      // await login(userData.email, userData.password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiService.logout();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    permissions,
    login,
    logout,
    register,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
