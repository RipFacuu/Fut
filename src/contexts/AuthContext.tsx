import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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
        const parsed = JSON.parse(token);
        setUser({
          id: parsed.id,
          username: parsed.username
        });
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // Busca el usuario por email
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return false;
    }

    // Compara la contraseña (sin hash por ahora)
    if (data.password !== password) return false;

    // Guarda el usuario autenticado
    const token = JSON.stringify({ id: data.id, username: data.nombre, email: data.email });
    localStorage.setItem('auth_token', token);
    setUser({ id: data.id, username: data.nombre });
    setIsAuthenticated(true);
    return true;
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