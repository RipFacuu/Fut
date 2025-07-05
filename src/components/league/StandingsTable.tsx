import React, { useState, useEffect } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { Download, Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Team {
  id: string;
  teamId: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  name?: string;
  teamName?: string;
  equipo_nombre?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  position: number;
  previousPosition?: number;
}

interface StandingsTableProps {
  teams: any[];
  title?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ teams, title = "Tabla de Posiciones" }) => {
  const { isAuthenticated } = useAuth();
  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medalIcons = [
    <Trophy key="gold" className="text-yellow-500" size={18} />,
    <Medal key="silver" className="text-gray-400" size={18} />,
    <Award key="bronze" className="text-amber-700" size={18} />
  ];

  // Simular datos de ejemplo para mostrar el diseño
  useEffect(() => {
    setLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      const mockData: Team[] = teams.slice(0, 10).map((team, index) => ({
        id: String(team.id || index),
        teamId: String(team.id),
        leagueId: '1',
        categoryId: '1',
        zoneId: '1',
        name: team.name || team.teamName || 'Equipo ' + (index + 1),
        teamName: team.name || team.teamName || 'Equipo ' + (index + 1),
        equipo_nombre: team.name || team.teamName || 'Equipo ' + (index + 1),
        points: Math.floor(Math.random() * 50) + 10,
        played: Math.floor(Math.random() * 20) + 10,
        won: Math.floor(Math.random() * 10) + 2,
        drawn: Math.floor(Math.random() * 5) + 1,
        lost: Math.floor(Math.random() * 8) + 1,
        goalsFor: Math.floor(Math.random() * 30) + 10,
        goalsAgainst: Math.floor(Math.random() * 25) + 8,
        goalDifference: 0,
        position: index + 1,
        previousPosition: undefined
      }));
      
      // Calcular diferencia de goles
      mockData.forEach(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
      });
      
      setStandings(mockData);
      setLoading(false);
    }, 1000);
  }, [teams]);

  const sortedStandings = standings.slice().sort((a, b) => {
    // First by points
    if (b.points !== a.points) return b.points - a.points;
    // Then by goal difference
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Then by goals for
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // Finally by team name
    return (a.name || '').localeCompare(b.name || '');
  });

  // Función mejorada para obtener el nombre del equipo
  const getTeamName = (teamId: string, standing?: Team): string => {
    // Primero intenta encontrar el equipo por ID
    const team = teams.find(team => team.id === teamId);
    if (team) {
      return team.name || team.teamName || team.equipo_nombre || 'Equipo Desconocido';
    }
    
    // Si no encuentra el equipo, usa el nombre del standing
    if (standing) {
      return standing.name || standing.teamName || standing.equipo_nombre || 'Equipo Desconocido';
    }
    
    return 'Equipo Desconocido';
  };

  const handleExportCSV = () => {
    const uniqueStandings = sortedStandings.filter((standing, index, self) => 
      index === self.findIndex(s => s.teamId === standing.teamId)
    );
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Posición,Equipo,Partidos Jugados,Puntos\n";
    
    uniqueStandings.forEach((standing, index) => {
      const teamName = getTeamName(standing.teamId, standing);
      csvContent += `${index + 1},${teamName},${standing.played},${standing.points}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `posiciones_liga.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return 'new';
    if (current < previous) return 'up';
    if (current > previous) return 'down';
    return 'same';
  };

  const getPositionIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp size={12} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={12} className="text-red-500" />;
      case 'same':
        return <Minus size={12} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getPositionBadge = (position: number) => {
    if (position <= 4) {
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    } else if (position <= 8) {
      return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    } else if (position >= sortedStandings.length - 3) {
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
    }
    return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="standings-container">
      {title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            {title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full"></div>
        </div>
      )}
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-200">
                <th className="px-4 py-4 text-left font-semibold text-slate-700">Pos</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-700">Equipo</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">PJ</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">G</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">E</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">P</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">GF</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">GC</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">DG</th>
                <th className="px-4 py-4 text-center font-semibold text-slate-700">Pts</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((team, index) => {
                const positionChange = getPositionChange(team.position, team.previousPosition);
                const isEven = index % 2 === 0;
                const teamName = getTeamName(team.teamId, team);
                
                return (
                  <tr 
                    key={team.id} 
                    className={`team-row transition-all duration-300 hover:scale-[1.01] ${
                      isEven ? 'bg-slate-50/50' : 'bg-white/50'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getPositionBadge(index + 1)}`}>
                          {index + 1}
                        </span>
                        {getPositionIcon(positionChange)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-700">
                            {teamName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800">{teamName}</span>
                        {index < 3 && (
                          <Trophy size={16} className="text-yellow-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-700">
                      {team.played}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {team.won}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {team.drawn}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        {team.lost}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-700">
                      {team.goalsFor}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-700">
                      {team.goalsAgainst}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        team.goalDifference > 0 
                          ? 'bg-green-100 text-green-700' 
                          : team.goalDifference < 0 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md">
                        {team.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
          <span className="text-sm text-slate-600">Clasificación a playoffs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
          <span className="text-sm text-slate-600">Posición media</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
          <span className="text-sm text-slate-600">Zona de descenso</span>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;
