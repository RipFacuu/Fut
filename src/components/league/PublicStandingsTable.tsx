import React, { useState, useEffect } from 'react';
import { useLeague, Standing } from '../../contexts/LeagueContext';
import { standingsLegendService } from '../../services/standingsLegendService';

interface PublicStandingsTableProps {
  leagueId: string;
  zoneId: string;
  categoryId: string;
}

type StandingWithNombre = Standing & { equipo_nombre?: string };

const medalIcons = [
  <svg key="gold" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  <svg key="silver" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-medal text-gray-400"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"></path><path d="M11 12 5.12 2.2"></path><path d="m13 12 5.88-9.8"></path><path d="M8 7h8"></path><circle cx="12" cy="17" r="5"></circle><path d="M12 18v-2h-.5"></path></svg>,
  <svg key="bronze" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award text-amber-700"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>
];

const PublicStandingsTable: React.FC<PublicStandingsTableProps> = ({ leagueId, zoneId, categoryId }) => {
  const { teams } = useLeague();
  const [standings, setStandings] = useState<StandingWithNombre[]>([]);
  const [legend, setLegend] = useState('');

  useEffect(() => {
    if (!zoneId || !categoryId) return;
    standingsLegendService.getLegend(zoneId, categoryId)
      .then(data => setLegend(data?.leyenda || ''));
  }, [zoneId, categoryId]);

  useEffect(() => {
    if (!zoneId || !categoryId) {
      setStandings([]);
      return;
    }
    // Aquí deberías usar tu función real para obtener standings
    // Simulación:
    import('../../lib/supabase').then(({ obtenerPosicionesPorZonaYCategoria }) => {
      obtenerPosicionesPorZonaYCategoria(zoneId, categoryId)
        .then(data => {
          // Log de duplicados que llegan desde la base
          console.log('Datos duplicados detectados:', data.filter((item, index, arr) => 
            arr.findIndex(other => other.equipo_id === item.equipo_id) !== index
          ));

          // Filtrar duplicados por combinación equipo_id-zona_id-categoria_id
          const uniqueDataMap = new Map();
          for (const pos of data) {
            const key = `${pos.equipo_id}-${pos.zona_id}-${pos.categoria_id}`;
            const prev = uniqueDataMap.get(key);
            if (!prev) {
              uniqueDataMap.set(key, pos);
            } else if ((!prev.equipo_nombre || prev.equipo_nombre.trim() === '') && (pos.equipo_nombre && pos.equipo_nombre.trim() !== '')) {
              uniqueDataMap.set(key, pos);
            }
          }
          const uniqueData = Array.from(uniqueDataMap.values());

          // Filtrar standings SOLO de la zona y categoría seleccionada y por teamId único
          const filteredStandings = uniqueData.filter(
            s => String(s.zoneId) === String(zoneId) && String(s.categoryId) === String(categoryId)
          );
          const seenTeamIds = new Set();
          const uniqueStandings = [];
          for (const s of filteredStandings) {
            if (!seenTeamIds.has(s.teamId)) {
              uniqueStandings.push(s);
              seenTeamIds.add(s.teamId);
            }
          }

          setStandings(uniqueData.map(pos => ({
            id: `${pos.equipo_id}-${pos.zona_id}-${pos.categoria_id}`,
            teamId: pos.equipo_id,
            leagueId,
            categoryId: String(pos.categoria_id),
            zoneId: pos.zona_id,
            puntos: pos.puntos || 0,
            pj: pos.pj || 0,
            orden: typeof pos.orden === 'number' ? pos.orden : 0,
            equipo_nombre: pos.equipo_nombre || '',
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0
          })));
        })
        // .catch(() => setError('Error al cargar la tabla de posiciones.'))
        // .finally(() => setLoading(false));
    });
  }, [zoneId, categoryId, leagueId]);

  // Ordenar standings por puntos y luego por diferencia de gol
  const sortedStandings = standings.slice().sort((a, b) => {
    if (typeof a.orden === 'number' && typeof b.orden === 'number' && a.orden !== b.orden) {
      return a.orden - b.orden;
    }
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Log para depuración
  console.log('Standings antes de filtrar:', standings);
  console.log('Standings ordenados:', sortedStandings);

  // Filtrar duplicados por teamId, priorizando la fila con equipo_nombre no vacío
  const uniqueStandingsMap = new Map();
  for (const s of sortedStandings) {
    if (!uniqueStandingsMap.has(s.teamId) || (s.equipo_nombre && s.equipo_nombre.trim() !== '')) {
      uniqueStandingsMap.set(s.teamId, s);
    }
  }
  const uniqueStandings = Array.from(uniqueStandingsMap.values());
  console.log('Standings únicos:', uniqueStandings);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="standings-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2">
          <div>
            <h3 className="text-lg font-semibold">Tabla de Posiciones</h3>
            {legend ? (
              <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-800">{legend}</span>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-800"><span className="text-gray-400">Agregar leyenda</span></span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button className="btn btn-outline btn-sm flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload "><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
              <span>Importar CSV</span>
            </button>
            <button className="btn btn-outline btn-sm flex items-center justify-center space-x-2 w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download "><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
        {/* Tabla tradicional para desktop */}
        <div className="overflow-x-auto rounded-lg shadow hidden md:block">
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
              {uniqueStandings.map((standing, index) => {
                const team = teams.find(t => t.id === standing.teamId);
                return (
                  <tr key={standing.id} className={
                    index < 3 ? 'hover:bg-gray-50 transition-colors bg-green-50/30' :
                    index >= uniqueStandings.length - 3 ? 'hover:bg-gray-50 transition-colors bg-red-50/30' :
                    'hover:bg-gray-50 transition-colors'
                  }>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">{index + 1}</span>
                        {index < 3 && medalIcons[index]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                          <span className="text-xs font-bold text-primary-700">{team?.name?.charAt(0) || '?'}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{standing.equipo_nombre && standing.equipo_nombre.trim() !== '' ? standing.equipo_nombre : standing.teamId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center font-medium">{standing.pj}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><span className="text-lg font-bold">{standing.puntos}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Vista tipo lista para mobile */}
        <div className="md:hidden space-y-3">
          {uniqueStandings.map((standing, index) => {
            const team = teams.find(t => t.id === standing.teamId);
            return (
              <div
                key={standing.id}
                className={
                  'flex items-center justify-between rounded-lg p-3 border ' +
                  (index < 3
                    ? 'bg-green-50 border-green-200'
                    : index >= uniqueStandings.length - 3
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200')
                }
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{index + 1}</span>
                    {index < 3 && <span>{medalIcons[index]}</span>}
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                    <span className="text-xs font-bold text-primary-700">{team?.name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{standing.equipo_nombre && standing.equipo_nombre.trim() !== '' ? standing.equipo_nombre : standing.teamId}</div>
                    <div className="flex space-x-2 mt-1">
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">PJ: {standing.pj}</span>
                      <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">PTS: {standing.puntos}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

export default PublicStandingsTable;