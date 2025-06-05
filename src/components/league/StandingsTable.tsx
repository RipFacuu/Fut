import React, { useState } from 'react';
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
  
  // Get standings for this zone
  const standings = getStandingsByZone(zoneId);
  
  // Sort standings by points (descending)
  const sortedStandings = [...standings].sort((a, b) => {
    // First by points
    if (b.points !== a.points) return b.points - a.points;
    // Then by goal difference
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Then by goals scored
    return b.goalsFor - a.goalsFor;
  });
  
  // Get team by ID
  const getTeam = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };
  
  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "POS,EQUIPO,PJ,PTS\n";
    
    sortedStandings.forEach((standing, index) => {
      const team = getTeam(standing.teamId);
      if (team) {
        csvContent += `${index + 1},${team.name},${standing.played},${standing.points}\n`;
      }
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
      <div className="flex justify-end mb-4 space-x-2">
        <ImportCSVButton zoneId={zoneId} onImportComplete={handleImportComplete} />
        <button 
          className="btn btn-outline btn-sm flex items-center space-x-2"
          onClick={handleExportCSV}
        >
          <Download size={16} />
          <span>Exportar CSV</span>
        </button>
      </div>
      
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
              const team = getTeam(standing.teamId);
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
                          alt={`${team.name} logo`} 
                          className="w-8 h-8 mr-3 rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 mr-3 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                          <span className="text-xs font-bold text-primary-700">
                            {team?.name.substring(0, 1)}
                          </span>
                        </div>
                      )}
                      <div className="text-base font-medium text-gray-900">
                        {team?.name || 'Equipo desconocido'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                    {standing.played}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold">{standing.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
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