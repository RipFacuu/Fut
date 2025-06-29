import React, { useState, useEffect } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import ImportCSVButton from './ImportCSVButton';
import { Download, Trophy, Medal, Award, Pencil, X, Save } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { standingsLegendService } from '../../services/standingsLegendService';

interface StandingsTableProps {
  leagueId: string;
  zoneId: string;
  categoryId: string;
}

const medalIcons = [
  <svg key="gold" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  <svg key="silver" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-medal text-gray-400"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"></path><path d="M11 12 5.12 2.2"></path><path d="m13 12 5.88-9.8"></path><path d="M8 7h8"></path><circle cx="12" cy="17" r="5"></circle><path d="M12 18v-2h-.5"></path></svg>,
  <svg key="bronze" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award text-amber-700"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
];

const StandingsTable: React.FC<StandingsTableProps> = ({ leagueId, zoneId, categoryId }) => {
  const { getStandingsByZone, teams, zones } = useLeague();
  const { isAuthenticated, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [editingLegend, setEditingLegend] = useState(false);
  const [legendValue, setLegendValue] = useState('');
  const [savingLegend, setSavingLegend] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legend, setLegend] = useState('');
  
  // Obtener la zona actual para mostrar la leyenda
  const currentZone = zones.find(zone => zone.id === zoneId);
  
  useEffect(() => {
    setLegendValue(currentZone?.legend || '');
  }, [currentZone?.legend]);
  
  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    if (!zoneId || !categoryId) {
      setStandings([]);
      return;
    }
    setLoading(true);
    setError(null);
    import('../../lib/supabase').then(({ obtenerPosicionesPorZonaYCategoria }) => {
      obtenerPosicionesPorZonaYCategoria(zoneId, categoryId)
        .then(data => {
          setStandings(data.map((pos, index) => ({
            id: `${pos.equipo_id}-${pos.zona_id}-${pos.categoria_id}-${index}`,
            teamId: pos.equipo_id,
            leagueId,
            categoryId: String(pos.categoria_id),
            zoneId: pos.zona_id,
            puntos: pos.puntos || 0,
            pj: pos.pj || 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0
          })));
        })
        .catch(() => setError('Error al cargar la tabla de posiciones.'))
        .finally(() => setLoading(false));
    });
  }, [zoneId, categoryId, leagueId]);
  
  // Get standings for this zone
  const sortedStandings = standings.slice().sort((a, b) => {
    // First by points
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    // Then by goal difference
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Then by goals scored
    return b.goalsFor - a.goalsFor;
  });
  
  // Filtrar standings duplicados por teamId y zoneId
  const uniqueStandings: typeof sortedStandings = [];
  const seen = new Set();
  for (const s of sortedStandings) {
    const key = `${s.teamId}_${s.zoneId}`;
    if (!seen.has(key)) {
      uniqueStandings.push(s);
      seen.add(key);
    }
  }
  
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
    // Verificar entorno del navegador
    if (typeof window === 'undefined') return;
    
    // Create CSV content
    let csvContent = "Posición,Equipo,PJ,Puntos\n";
    uniqueStandings.forEach((standing, index) => {
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
    URL.revokeObjectURL(url);
  };
  
  // Handle import complete
  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  if (uniqueStandings.length === 0) {
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
  
  const handleSaveLegend = async () => {
    setSavingLegend(true);
    await standingsLegendService.upsertLegend(zoneId, categoryId, legendValue);
    setLegend(legendValue);
    setEditingLegend(false);
    setSavingLegend(false);
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="standings-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2">
          <div>
            <h3 className="text-lg font-semibold">Tabla de Posiciones</h3>
            {editingLegend ? (
              <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                <input
                  className="form-input text-sm font-medium text-blue-800 bg-white border-blue-300 rounded px-2 py-1 mr-2"
                  value={legendValue}
                  onChange={e => setLegendValue(e.target.value)}
                  disabled={savingLegend}
                  maxLength={50}
                  placeholder="Ej: Apertura 2025, Clausura 2025"
                  style={{ minWidth: 120 }}
                />
                <button
                  className="btn btn-xs btn-success flex items-center"
                  onClick={handleSaveLegend}
                  disabled={savingLegend}
                  title="Guardar leyenda"
                >
                  <span>Guardar</span>
                </button>
                <button
                  className="btn btn-xs btn-outline flex items-center"
                  onClick={() => { setEditingLegend(false); setLegendValue(legend); }}
                  disabled={savingLegend}
                  title="Cancelar"
                >
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-800">{legend || <span className="text-gray-400">Agregar leyenda</span>}</span>
                {isAuthenticated && user?.username === 'admin' && (
                  <button
                    className="ml-2 text-blue-700 hover:text-blue-900"
                    onClick={() => setEditingLegend(true)}
                    title={legend ? "Editar leyenda" : "Agregar leyenda"}
                  >
                    Editar
                  </button>
                )}
              </div>
            )}
          </div>
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
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider w-16">Pos</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Equipo</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider w-20">PJ</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider w-20">PTS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStandings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    No hay equipos en esta zona.
                  </td>
                </tr>
              ) : (
                sortedStandings.map((s, idx) => {
                  const team = teams.find(t => t.id === s.teamId);
                  return (
                    <tr key={s.id} className={
                      idx < 3 ? 'hover:bg-gray-50 transition-colors bg-green-50/30' :
                      idx >= sortedStandings.length - 3 ? 'hover:bg-gray-50 transition-colors bg-red-50/30' :
                      'hover:bg-gray-50 transition-colors'
                    }>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">{idx + 1}</span>
                          {idx < 3 && medalIcons[idx]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-3 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                            <span className="text-xs font-bold text-primary-700">{team?.name?.charAt(0) || '?'}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{team?.name || s.teamId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">{s.pj}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><span className="text-lg font-bold">{s.puntos}</span></td>
                    </tr>
                  );
                })
              )}
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
    </div>
  );
};

export default StandingsTable;
