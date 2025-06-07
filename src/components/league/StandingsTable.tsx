import React, { useState, useEffect } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import ImportCSVButton from './ImportCSVButton';
import { Download, Trophy, Medal, Award } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StandingsTableProps {
  zoneId: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ zoneId }) => {
  const { getStandingsByZone, teams } = useLeague();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Get standings for this zone
  const standings = getStandingsByZone(zoneId);
  
  // Sort standings by points (descending)
  const sortedStandings = [...standings].sort((a, b) => {
    // First by points
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    // Then by goal difference
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Then by goals scored
    return b.goalsFor - a.goalsFor;
  });
  
  // Función mejorada para obtener el nombre del equipo
  const getTeamName = (teamId: string, standing?: any): string => {
    // Primero intenta encontrar el equipo por ID
    const team = teams.find(team => team.id === teamId);
    if (team) {
      return team.name;
    }
    
    // Si no encuentra el equipo, busca en los datos del standing
    // Primero verifica si hay teamName (viene del mapper de posiciones_editable)
    if (standing && standing.teamName) {
      return standing.teamName;
    }
    
    // También verifica equipo_nombre por compatibilidad
    if (standing && standing.equipo_nombre) {
      return standing.equipo_nombre;
    }
    
    // Fallback más informativo
    return `Equipo ${teamId}`;
  };
  
  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "POS,EQUIPO,PJ,PTS\n";
    
    sortedStandings.forEach((standing, index) => {
      const teamName = getTeamName(standing.teamId, standing);
      csvContent += `${index + 1},${teamName},${standing.pj},${standing.puntos}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `standings_${zoneId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle import complete
  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  if (standings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay equipos en esta zona.</p>
      </div>
    );
  }
  
  // Función para obtener el ícono según la posición
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="text-yellow-500" size={18} />;
      case 2:
        return <Medal className="text-gray-400" size={18} />;
      case 3:
        return <Award className="text-amber-700" size={18} />;
      default:
        return null;
    }
  };
  
  return (
    <div key={refreshKey} className="standings-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2">
        <h3 className="text-lg font-semibold">Tabla de Posiciones</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <ImportCSVButton zoneId={zoneId} onImportComplete={handleImportComplete} />
          <button 
            className="btn btn-outline btn-sm flex items-center justify-center space-x-2 w-full sm:w-auto"
            onClick={handleExportCSV}
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>
      
      {/* Vista móvil */}
      {isMobile ? (
        <div className="space-y-3">
          {sortedStandings.map((standing, index) => {
            const teamName = getTeamName(standing.teamId, standing);
            const team = teams.find(team => team.id === standing.teamId);
            const position = index + 1;
            
            return (
              <div key={standing.id} className={cn(
                "bg-white rounded-lg p-4 shadow-sm border",
                position <= 3 && "border-green-200 bg-green-50/30",
                position >= sortedStandings.length - 2 && "border-red-200 bg-red-50/30"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xl">{position}</span>
                      {getPositionIcon(position)}
                    </div>
                    {team?.logo ? (
                      <img 
                        src={team.logo} 
                        alt={`${teamName} logo`} 
                        className="w-10 h-10 rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                        <span className="text-sm font-bold text-primary-700">
                          {teamName.substring(0, 1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">{standing.puntos}</div>
                    <div className="text-xs text-gray-500">PTS</div>
                  </div>
                </div>
                <div className="text-base font-medium text-gray-900 mb-2">
                  {teamName}
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Partidos: <strong>{standing.pj}</strong></span>
                  <span>Dif. Gol: <strong>{standing.goalsFor - standing.goalsAgainst}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vista desktop
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider w-16">
                  Pos
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider w-20">
                  PJ
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider w-20">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStandings.map((standing, index) => {
                const teamName = getTeamName(standing.teamId, standing);
                const team = teams.find(team => team.id === standing.teamId);
                const position = index + 1;
                
                return (
                  <tr key={standing.id} className={cn(
                    "hover:bg-gray-50 transition-colors",
                    position <= 3 && "bg-green-50/30",
                    position >= sortedStandings.length - 2 && "bg-red-50/30"
                  )}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">{position}</span>
                        {getPositionIcon(position)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {team?.logo ? (
                          <img 
                            src={team.logo} 
                            alt={`${teamName} logo`} 
                            className="w-8 h-8 mr-3 rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 mr-3 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                            <span className="text-xs font-bold text-primary-700">
                              {teamName.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {teamName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                      {standing.pj}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-lg font-bold">{standing.puntos}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-1">Clasificación</h4>
          <p className="text-green-700">Equipos en posiciones de clasificación</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-1">Zona Media</h4>
          <p className="text-gray-700">Equipos en posiciones intermedias</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-800 mb-1">Descenso</h4>
          <p className="text-red-700">Equipos en riesgo de descenso</p>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;
