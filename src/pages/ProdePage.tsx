import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { ProdeService, MatchWithPrediction } from '../services/prodeService';
import { ProdeMatchCard } from '../components/prode/ProdeMatchCard';
import { ProdeLeaderboard } from '../components/prode/ProdeLeaderboard';
import { cn } from '../utils/cn';

const ProdePage: React.FC = () => {
  const { user, isAuthenticated } = useUserAuth();
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchWithPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [selectedTorneo, setSelectedTorneo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard'>('matches');
  
  // Estados para estadísticas del usuario
  const [userStats, setUserStats] = useState<{
    total_points: number;
    total_predictions: number;
    correct_predictions: number;
    accuracy_percentage: number;
  } | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    applyFilters();
  }, [matches, selectedDate, selectedCategory, selectedZona, selectedTorneo]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ProdeService.getAvailableMatches(user?.id);
      setMatches(data);
    } catch (error) {
      console.error('Error cargando partidos:', error);
      setError('Error al cargar los partidos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      const stats = await ProdeService.getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas del usuario:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Filtro por fecha
    if (selectedDate) {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.fecha);
        const filterDate = new Date(selectedDate);
        return matchDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filtro por zona
    if (selectedZona) {
      filtered = filtered.filter(match => match.zona.id === selectedZona);
    }

    // Filtro por torneo (leyenda del fixture)
    if (selectedTorneo) {
      filtered = filtered.filter(match => match.fixture_info?.leyenda === selectedTorneo);
    }

    // Filtro por categoría (a través de zona) - mantener para compatibilidad
    if (selectedCategory) {
      filtered = filtered.filter(match => match.zona.id === selectedCategory);
    }

    setFilteredMatches(filtered);
  };

  const handlePredictionUpdate = () => {
    // Recargar partidos y estadísticas del usuario
    loadMatches();
    if (isAuthenticated && user) {
      loadUserStats();
    }
  };

  const handlePrediction = async (match: MatchWithPrediction, prediction: 'local' | 'empate' | 'visitante') => {
    if (!user || !match.can_predict) return;
    
    try {
      let result;
      
      if (match.user_prediction) {
        // Actualizar predicción existente
        result = await ProdeService.updatePrediction(user.id, match.id, prediction);
      } else {
        // Crear nueva predicción
        result = await ProdeService.createPrediction(user.id, match.id, prediction);
      }

      if (result) {
        // Recargar partidos y estadísticas
        handlePredictionUpdate();
      }
    } catch (error) {
      console.error('Error al guardar predicción:', error);
    }
  };

  const getAvailableDates = () => {
    const dates = matches.map(match => new Date(match.fecha).toDateString());
    const uniqueDates = [...new Set(dates)];
    return uniqueDates.sort();
  };

  const getAvailableZonas = () => {
    const zonas = matches.map(match => match.zona);
    const uniqueZonas = zonas.filter((zona, index, self) => 
      index === self.findIndex(z => z.id === zona.id)
    );
    return uniqueZonas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  const getAvailableTorneos = () => {
    const torneos = matches
      .map(match => match.fixture_info?.leyenda)
      .filter((torneo): torneo is string => !!torneo);
    const uniqueTorneos = [...new Set(torneos)];
    return uniqueTorneos.sort();
  };

  const getAvailableFixtures = () => {
    const fixtures = matches
      .map(match => match.fixture_info?.nombre)
      .filter((fixture): fixture is string => !!fixture);
    const uniqueFixtures = [...new Set(fixtures)];
    return uniqueFixtures.sort();
  };

  const getAvailableCategories = () => {
    const categories = matches.map(match => ({
      id: match.zona.id,
      name: match.zona.nombre
    }));
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex(c => c.id === category.id)
    );
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMatchesCount = () => {
    if (selectedDate || selectedZona || selectedTorneo || selectedCategory) {
      return filteredMatches.length;
    }
    return matches.length;
  };

  const getUpcomingMatches = () => {
    const now = new Date();
    return matches.filter(match => new Date(match.fecha) > now);
  };

  const getPastMatches = () => {
    const now = new Date();
    return matches.filter(match => new Date(match.fecha) <= now);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-xl text-gray-600">Cargando Prode...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏆 Prode - Pronósticos Deportivos
            </h1>
            <p className="text-xl text-gray-600">
              ¡Predice los resultados y compite con otros jugadores!
            </p>
          </div>

          {/* Estadísticas del usuario */}
          {isAuthenticated && userStats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats.total_points}</div>
                <div className="text-sm text-blue-600">Puntos</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userStats.total_predictions}</div>
                <div className="text-sm text-green-600">Predicciones</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{userStats.correct_predictions}</div>
                <div className="text-sm text-purple-600">Aciertos</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{userStats.accuracy_percentage}%</div>
                <div className="text-sm text-yellow-600">Precisión</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs de navegación */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setActiveTab('matches')}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-all duration-200",
                activeTab === 'matches'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              ⚽ Partidos
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-all duration-200",
                activeTab === 'leaderboard'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              🏆 Tabla de Posiciones
            </button>
          </div>
        </div>

        {/* Tab de Partidos */}
        {activeTab === 'matches' && (
          <div>
            {/* Header del Fixture - Estilo igual a los fixtures */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedTorneo || 'TODOS LOS TORNEOS'}
              </h2>
              <p className="text-xl text-gray-600">
                {selectedDate ? formatDateForDisplay(selectedDate) : 'Todas las fechas disponibles'}
              </p>
            </div>

            {/* Barra de filtros - Estilo azul-púrpura como en la imagen */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-4 space-y-3 sm:space-y-0">
                {/* Filtro de Zona - Centrado en móvil, izquierda en desktop */}
                <div className="flex items-center space-x-2 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <select
                    value={selectedZona}
                    onChange={(e) => setSelectedZona(e.target.value)}
                    className="bg-transparent text-white font-semibold border-none outline-none cursor-pointer text-center sm:text-left"
                  >
                    <option value="" className="text-gray-800">TODAS LAS ZONAS</option>
                    {getAvailableZonas().map(zona => (
                      <option key={zona.id} value={zona.id} className="text-gray-800">
                        {zona.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Torneo - Centrado en móvil, derecha en desktop */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedTorneo}
                    onChange={(e) => setSelectedTorneo(e.target.value)}
                    className="bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/30 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-white/30 transition-all duration-200 text-center sm:text-left"
                  >
                    <option value="" className="text-gray-800">TODOS LOS TORNEOS</option>
                    {getAvailableTorneos().map(torneo => (
                      <option key={torneo} value={torneo} className="text-gray-800">
                        {torneo}
                      </option>
                    ))}
                  </select>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtros adicionales - Estilo compacto y responsive */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Filtro por fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center sm:text-left">
                    📅 Fecha del Fixture
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center sm:text-left"
                  >
                    <option value="">Todas las fechas</option>
                    {getAvailableDates().map(dateString => (
                      <option key={dateString} value={dateString}>
                        {formatDateForDisplay(dateString)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por fixture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center sm:text-left">
                    📋 Fixture Específico
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center sm:text-left"
                  >
                    <option value="">Todos los fixtures</option>
                    {getAvailableFixtures().map(fixture => (
                      <option key={fixture} value={fixture}>
                        {fixture}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón limpiar filtros */}
              {(selectedDate || selectedZona || selectedTorneo || selectedCategory) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setSelectedZona('');
                      setSelectedTorneo('');
                      setSelectedCategory('');
                    }}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    🗑️ Limpiar Filtros
                  </button>
                </div>
              )}
            </div>

            {/* Información de partidos */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{getMatchesCount()}</div>
                  <div className="text-sm text-blue-600">Partidos {(selectedDate || selectedZona || selectedTorneo || selectedCategory) ? 'filtrados' : 'totales'}</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getUpcomingMatches().length}</div>
                  <div className="text-sm text-green-600">Próximos partidos</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{getPastMatches().length}</div>
                  <div className="text-sm text-purple-600">Partidos jugados</div>
                </div>
              </div>
            </div>

            {/* Lista de partidos - Estilo igual a los fixtures */}
            {error ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-red-600 text-lg mb-2">❌ Error</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={loadMatches}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔄 Reintentar
                </button>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-500 text-lg mb-2">⚽</div>
                <div className="text-gray-600">No hay partidos disponibles</div>
                <div className="text-gray-500 text-sm">
                  {selectedDate || selectedZona || selectedTorneo || selectedCategory 
                    ? 'Intenta cambiar los filtros' 
                    : 'Vuelve más tarde para ver nuevos partidos'
                  }
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {filteredMatches.map((match, index) => (
                    <div
                      key={match.id}
                      className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 overflow-hidden"
                    >
                      {/* Fila principal del partido - Centrada y responsive */}
                      <div className="p-4">
                        {/* Número del partido - Círculo púrpura centrado */}
                        <div className="text-center mb-3">
                          <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto">
                            {index + 1}
                          </div>
                        </div>

                        {/* Equipos y VS - Centrados */}
                        <div className="text-center mb-3">
                          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                            {/* Equipo Local */}
                            <div className="text-gray-900 font-medium text-center">
                              <div className="text-sm text-gray-500 mb-1">Local</div>
                              <div className="text-base">{match.equipo_local.nombre}</div>
                            </div>

                            {/* VS - Texto azul centrado */}
                            <div className="text-blue-600 font-bold text-xl px-4">
                              VS
                            </div>

                            {/* Equipo Visitante */}
                            <div className="text-gray-900 font-medium text-center">
                              <div className="text-sm text-gray-500 mb-1">Visitante</div>
                              <div className="text-base">{match.equipo_visitante.nombre}</div>
                            </div>
                          </div>
                        </div>

                        {/* Estado del partido - Centrado */}
                        <div className="text-center mb-3">
                          <div className="text-sm text-gray-500">
                            {match.can_predict ? (
                              <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full">🕐 Abierto</span>
                            ) : (
                              <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full">🔒 Cerrado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de predicción - Centrados y optimizados para móvil */}
                      {match.can_predict && (
                        <div className="bg-white/50 border-t border-gray-200 p-4">
                          <div className="text-center mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              ¿Quién ganará este partido?
                            </span>
                          </div>
                          
                          {/* Botones en columna para móvil, fila para desktop */}
                          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                              onClick={() => handlePrediction(match, 'local')}
                              className={`px-4 py-3 sm:px-6 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                match.user_prediction === 'local'
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-lg sm:text-base">🏠</span>
                                <span className="font-medium">Local</span>
                              </div>
                            </button>
                            
                            <button
                              onClick={() => handlePrediction(match, 'empate')}
                              className={`px-4 py-3 sm:px-6 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                match.user_prediction === 'empate'
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-lg sm:text-base">🤝</span>
                                <span className="font-medium">Empate</span>
                              </div>
                            </button>
                            
                            <button
                              onClick={() => handlePrediction(match, 'visitante')}
                              className={`px-4 py-3 sm:px-6 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                match.user_prediction === 'visitante'
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-lg sm:text-base">🚌</span>
                                <span className="font-medium">Visitante</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab de Tabla de Posiciones */}
        {activeTab === 'leaderboard' && (
          <ProdeLeaderboard />
        )}

        {/* Información adicional */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Cómo funciona el Prode</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Hacer Predicciones</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Elige entre Local, Empate o Visitante</li>
                <li>• Solo puedes predecir hasta 15 minutos antes del partido</li>
                <li>• Puedes cambiar tu predicción hasta que se cierre</li>
                <li>• Una vez cerrado, no se pueden hacer cambios</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏆 Sistema de Puntos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 3 puntos por predicción correcta</li>
                <li>• 0 puntos por predicción incorrecta</li>
                <li>• Los puntos se suman automáticamente</li>
                <li>• ¡Compite por el primer lugar!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer - Estilo igual a los fixtures */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Los horarios de los partidos pueden estar sujetos a cambios. Consulta siempre la información oficial.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProdePage;
