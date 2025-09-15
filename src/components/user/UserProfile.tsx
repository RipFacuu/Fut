import React, { useState } from 'react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { UserService, Team } from '../../services/userService';
import { cn } from '../../utils/cn';

interface UserProfileProps {
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { user, logout } = useUserAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    escuela: user?.escuela || '',
    equipo_id: user?.equipo_id || '',
    email: user?.email || '',
  });

  React.useEffect(() => {
    if (user) {
      loadTeams();
      setEditData({
        nombre: user.nombre,
        apellido: user.apellido,
        escuela: user.escuela,
        equipo_id: user.equipo_id || '',
        email: user.email || '',
      });
    }
  }, [user]);

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
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await UserService.updateUser(user.id, editData);
      setIsEditing(false);
      // Recargar la página para actualizar los datos
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      escuela: user?.escuela || '',
      equipo_id: user?.equipo_id || '',
      email: user?.email || '',
    });
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
    }
  };

  if (!user) return null;

  const currentTeam = teams.find(team => team.id === user.equipo_id);

  return (
    <div className={cn("bg-white rounded-lg shadow-md p-6", className)}>
      {/* Header del perfil */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.nombre} {user.apellido}
            </h3>
            <p className="text-sm text-gray-500">Jugador de la Liga</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              ✏️ Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? '💾 Guardando...' : '💾 Guardar'}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </>
          )}
          
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isEditing ? (
          // Formulario de edición
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={editData.nombre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={editData.apellido}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏫 Escuela
              </label>
              <input
                type="text"
                name="escuela"
                value={editData.escuela}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⚽ Equipo
              </label>
              <select
                name="equipo_id"
                value={editData.equipo_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : (
          // Vista de solo lectura
          <>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">📋 Documento:</span>
                <p className="text-gray-900">{user.documento}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">🎂 Fecha de Nacimiento:</span>
                <p className="text-gray-900">
                  {new Date(user.fecha_nacimiento).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">🏫 Escuela:</span>
                <p className="text-gray-900">{user.escuela}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">⚽ Equipo:</span>
                <p className="text-gray-900">
                  {currentTeam ? currentTeam.nombre : 'No asignado'}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">📧 Email:</span>
                <p className="text-gray-900">
                  {user.email || 'No especificado'}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">📅 Miembro desde:</span>
                <p className="text-gray-900">
                  {new Date(user.created_at || '').toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Información adicional */}
      {!isEditing && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            📊 Información de la Liga
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">🏆</span>
              <p className="text-sm text-gray-600 mt-1">Posición en Zona</p>
              <p className="text-lg font-semibold text-blue-600">--</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">⚽</span>
              <p className="text-sm text-gray-600 mt-1">Partidos Jugados</p>
              <p className="text-lg font-semibold text-green-600">--</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">📅</span>
              <p className="text-sm text-gray-600 mt-1">Próximo Partido</p>
              <p className="text-lg font-semibold text-purple-600">--</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
