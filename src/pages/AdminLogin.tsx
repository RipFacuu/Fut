import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { User, Lock, AlertCircle } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const success = await login(data.username, data.password);
      
      if (success) {
        navigate('/admin');
      } else {
        setLoginError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setLoginError('Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-primary-600 p-6">
          <h1 className="text-2xl font-bold text-white text-center">Administración</h1>
          <p className="text-primary-100 text-center mt-2">
            Accede para gestionar Liga Participando
          </p>
        </div>
        
        <div className="p-6">
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
              <AlertCircle size={18} className="text-red-500 mt-0.5" />
              <span className="text-red-700">{loginError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="username" className="form-label">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  className="form-input pl-10"
                  placeholder="Ingresa tu nombre de usuario"
                  autoComplete="username"
                  {...register('username', { required: 'Usuario es requerido' })}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input pl-10"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  {...register('password', { required: 'Contraseña es requerida' })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full btn btn-primary py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;