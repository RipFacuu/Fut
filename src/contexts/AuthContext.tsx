import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<{id: string; username: string}>(token);
        setUser({
          id: decoded.id,
          username: decoded.username
        });
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);
  
  // Mock login function (in a real app, this would call an API)
  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock successful login for admin/admin
    if (username === 'admin' && password === 'admin') {
      const mockUser = {
        id: '1',
        username: 'admin'
      };
      
      // Mock JWT token (this would come from the server in a real app)
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6ImFkbWluIn0.8tat9J_uRfI23gNX2qqSZMVsJ3Q-oVGpQOgqB9RcQcM';
      
      localStorage.setItem('auth_token', mockToken);
      setUser(mockUser);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};