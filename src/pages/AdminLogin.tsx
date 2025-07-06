import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Eye, EyeOff, Lock, User, Sparkles } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/admin');
      } else {
        setError('Credenciales inválidas. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-indigo-400 rounded-full animate-pulse opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card de login */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header del card */}
          <div className="relative bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
                  <Trophy size={48} className="relative text-white drop-shadow-lg" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Panel Administrativo
              </h1>
              <p className="text-white/80 text-sm">
                Accede a la gestión de ligas y equipos
              </p>
              <div className="flex justify-center mt-3 space-x-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="form-label flex items-center">
                  <User size={16} className="mr-2 text-primary-600" />
                  Usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input pl-12"
                    placeholder="admin"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={20} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="form-label flex items-center">
                  <Lock size={16} className="mr-2 text-primary-600" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-12 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-slate-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary text-lg py-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <Lock size={20} className="mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Enlaces adicionales */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center">
                <a 
                  href="/" 
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-300 flex items-center justify-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    ← Volver al inicio
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            ¿Necesitas ayuda? Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;