import React from 'react';
import { UserAuthForm } from '../components/user/UserAuthForm';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useNavigate } from 'react-router-dom';

const UserAuthPage: React.FC = () => {
  const { isAuthenticated, user } = useUserAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir a la página principal
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleAuthSuccess = () => {
    // Redirigir a la página principal después del login/registro exitoso
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">⚽</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Liga Infantil</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a la Liga Infantil! 🏆
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Únete a nuestra comunidad de jóvenes futbolistas. Crea tu cuenta o inicia sesión 
            para acceder a toda la información de tu equipo y la liga.
          </p>
        </div>

        {/* Formulario de autenticación */}
        <div className="flex justify-center">
          <UserAuthForm onSuccess={handleAuthSuccess} />
        </div>

        {/* Información adicional */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comunidad</h3>
            <p className="text-gray-600">
              Conecta con otros jugadores y familias de la liga
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas</h3>
            <p className="text-gray-600">
              Accede a resultados, posiciones y calendario de partidos
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notificaciones</h3>
            <p className="text-gray-600">
              Recibe actualizaciones importantes de tu equipo
            </p>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              ¿Necesitas ayuda? 🤔
            </h4>
            <p className="text-gray-600 mb-4">
              Si tienes problemas para crear tu cuenta o iniciar sesión, 
              contacta con los administradores de la liga.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200">
                📧 Contactar Soporte
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200">
                ❓ Preguntas Frecuentes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAuthPage;
