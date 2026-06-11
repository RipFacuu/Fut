import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { UserService, UserRegistrationData, UserLoginData, Team } from '../../services/userService';
import { cn } from '../../utils/cn';

interface UserAuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const UserAuthForm: React.FC<UserAuthFormProps> = ({ onSuccess, className }) => {
  const { login, register, error, clearError, isLoading } = useUserAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    documento: '',
    escuela: '',
    equipo_id: '',
    email: '',
    password: '',
  });

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [isLoginMode]);

  const loadTeams = async () => {
    try {
      const teamsData = await UserService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoginMode) {
      const success = await login(loginData);
      if (success) {
        setSuccessMessage('¡Inicio de sesión exitoso!');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess?.();
        }, 2000);
      }
    } else {
      const success = await register(formData);
      if (success) {
        setSuccessMessage('¡Registro exitoso! Bienvenido a la liga.');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess?.();
        }, 3000);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      fecha_nacimiento: '',
      documento: '',
      escuela: '',
      equipo_id: '',
      email: '',
      password: '',
    });
    setLoginData({
      email: '',
      password: '',
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
    clearError();
  };

  return (
    <div className={cn("max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden", className)}>
      {/* Header con colores amigables */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 px-6 py-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {isLoginMode ? '🏆 Iniciar Sesión' : '⚽ Crear Cuenta'}
        </h2>
        <p className="text-blue-100 text-center mt-1">
          {isLoginMode ? '¡Bienvenido de vuelta!' : '¡Únete a nuestra liga!'}
        </p>
      </div>

      {/* Mensajes de éxito y error */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          {error}
        </div>
      )}

      <div className="px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoginMode ? (
            // Formulario de Login
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  📧 Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  🔒 Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </>
          ) : (
            // Formulario de Registro
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    👤 Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                    👤 Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                  🎂 Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-1">
                  📋 Documento
                </label>
                <input
                  type="text"
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Solo números"
                  required
                />
              </div>

              

              <div>
                <label htmlFor="equipo_id" className="block text-sm font-medium text-gray-700 mb-1">
                  ⚽ Equipo
                </label>
                <select
                  id="equipo_id"
                  name="equipo_id"
                  value={formData.equipo_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona tu equipo</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.nombre}
                    </option>
                  ))}
                </select>
              </div>

              

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  🔒 Contraseña (opcional)
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Crea una contraseña"
                />
              </div>
            </>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 px-4 rounded-md hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLoginMode ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </span>
            ) : (
              <span>{isLoginMode ? '🚀 Iniciar Sesión' : '✅ Crear Cuenta'}</span>
            )}
          </button>
        </form>

        {/* Toggle entre login y registro */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            {isLoginMode 
              ? "¿No tienes cuenta? ¡Crea una aquí!" 
              : "¿Ya tienes cuenta? ¡Inicia sesión aquí!"
            }
          </button>
        </div>
      </div>
    </div>
  );
};
