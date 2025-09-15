import React from 'react';
import { ProdeService, ProdeLeaderboardEntry } from '../../services/prodeService';
import { cn } from '../../utils/cn';

interface ProdeLeaderboardProps {
  className?: string;
}

export const ProdeLeaderboard: React.FC<ProdeLeaderboardProps> = ({ className }) => {
  const [leaderboard, setLeaderboard] = React.useState<ProdeLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ProdeService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error cargando tabla de posiciones:', error);
      setError('Error al cargar la tabla de posiciones');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-white text-gray-700 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-md p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando tabla de posiciones...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-white rounded-lg shadow-md p-6", className)}>
        <div className="text-center py-8">
          <div className="text-red-600 text-lg mb-2">❌ Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg shadow-md p-6", className)}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">🏆</div>
          <div className="text-gray-600">No hay participantes aún</div>
          <div className="text-gray-500 text-sm">¡Sé el primero en hacer predicciones!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-md", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          🏆 Tabla de Posiciones del Prode
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Ranking de jugadores según sus predicciones acertadas
        </p>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posición
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jugador
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Predicciones
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aciertos
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precisión
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry, index) => (
              <tr 
                key={entry.user_id}
                className={cn(
                  "hover:bg-gray-50 transition-colors duration-150",
                  index < 3 && "bg-gradient-to-r from-yellow-50 to-orange-50"
                )}
              >
                {/* Posición */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm",
                    getRankClass(entry.rank)
                  )}>
                    {getRankIcon(entry.rank)}
                  </div>
                </td>

                {/* Nombre del jugador */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.user_name}
                  </div>
                  {index < 3 && (
                    <div className="text-xs text-gray-500">
                      {index === 0 ? 'Campeón' : index === 1 ? 'Subcampeón' : 'Tercer lugar'}
                    </div>
                  )}
                </td>

                {/* Puntos totales */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {entry.total_points}
                  </div>
                  <div className="text-xs text-gray-500">puntos</div>
                </td>

                {/* Total de predicciones */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.total_predictions}
                  </div>
                  <div className="text-xs text-gray-500">total</div>
                </td>

                {/* Predicciones correctas */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-green-600">
                    {entry.correct_predictions}
                  </div>
                  <div className="text-xs text-gray-500">aciertos</div>
                </td>

                {/* Porcentaje de precisión */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-purple-600">
                    {entry.accuracy_percentage}%
                  </div>
                  <div className="text-xs text-gray-500">precisión</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>👥 Total de participantes: {leaderboard.length}</span>
            <span>🏆 Puntos máximos: {Math.max(...leaderboard.map(e => e.total_points))}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>📊 Promedio de puntos: {
              Math.round(leaderboard.reduce((sum, e) => sum + e.total_points, 0) / leaderboard.length)
            }</span>
            <span>🎯 Mejor precisión: {
              Math.max(...leaderboard.map(e => e.accuracy_percentage))
            }%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
