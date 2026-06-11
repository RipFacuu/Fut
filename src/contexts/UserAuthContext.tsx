import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserService, UserRegistrationData, UserLoginData } from '../services/userService';
import { Database } from '../types/database';

type Usuario = Database['public']['Tables']['usuarios']['Row'];

interface UserAuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLoginData) => Promise<boolean>;
  register: (data: UserRegistrationData) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: UserLoginData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Intentando login con email:', data.email);

      // Primero intentar con la base de datos
      try {
        const dbUser = await UserService.getUserByEmail(data.email);
        
        if (dbUser) {
          console.log('👤 Usuario de BD encontrado:', dbUser);
          
          if (dbUser.password && dbUser.password !== data.password) {
            setError('Contraseña incorrecta');
            return false;
          }

          setUser(dbUser);
          setIsAuthenticated(true);
          localStorage.setItem('user_data', JSON.stringify(dbUser));
          console.log('🎉 Login exitoso para:', dbUser.nombre);
          return true;
        }
      } catch (error) {
        console.error('Error al consultar BD:', error);
      }

      setError('Usuario no encontrado o contraseña incorrecta');
      return false;

    } catch (error: unknown) {
      console.error('❌ Error en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al iniciar sesión: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: UserRegistrationData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar datos
      const validationErrors = UserService.validateRegistrationData(data);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return false;
      }

      // Crear usuario
      const newUser = await UserService.createUser(data);
      
      if (newUser) {
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('user_data', JSON.stringify(newUser));
        return true;
      }

      return false;

    } catch (error: unknown) {
      console.error('Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user_data');
  };

  const clearError = () => {
    setError(null);
  };

  const value: UserAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};
