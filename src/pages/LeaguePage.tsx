import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import CategoryPanel from '../components/league/CategoryPanel';
import FixtureList from '../components/league/FixtureList';
import StandingsTable from '../components/league/StandingsTable';
import TeamList from '../components/league/TeamList';
import { Trophy, Users, ClipboardList, Newspaper } from 'lucide-react';
import { cn } from '../utils/cn';
import ZonePanel from '../components/league/ZonePanel';
import PublicStandingsTable from '../components/league/PublicStandingsTable';

type Tab = 'fixtures' | 'results' | 'standings' | 'teams';

const LeaguePage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { getLeague, getCategoriesByLeague, getZonesByLeague, refreshFixtures, refreshCategories, refreshZones } = useLeague();
  const [activeTab, setActiveTab] = useState<Tab>('fixtures');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'init' | 'fixture' | 'standings'>('init');
  
  // Refrescar zonas y categorías al montar la página
  useEffect(() => {
    const refreshData = async () => {
      await refreshCategories();
      await refreshZones();
    };
    refreshData();
  }, [refreshCategories, refreshZones]); // ❌ Estas funciones se recrean en cada render
  
  // Cargar fixtures al montar el componente
  useEffect(() => {
    const loadFixtures = async () => {
      try {
        setIsLoading(true);
        await refreshFixtures();
        console.log('Fixtures loaded in LeaguePage');
      } catch (error) {
        console.error('Error loading fixtures in LeaguePage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFixtures();
  }, [refreshFixtures]);
  
  // Get league data
  const league = getLeague(leagueId || '');
  
  // Get categories for this league
  const categories = getCategoriesByLeague(leagueId || '');
  
  // Get zones for this league
  const zones = getZonesByLeague(leagueId || '');
  
  // CÓDIGO DE DEBUGGING TEMPORAL - Agregar después de obtener categories y zones
  useEffect(() => {
    if (leagueId === 'liga_masculina') {
      console.log('=== DEBUGGING LIGA PARTICIPANDO ===');
      console.log('League ID:', leagueId);
      console.log('Todas las categorías:', categories);
      console.log('Todas las zonas:', zones);
      
      // Verificar qué categorías tienen zoneId
      const categoriesWithZone = categories.filter(cat => (cat as any).zoneId);
      const categoriesWithoutZone = categories.filter(cat => !(cat as any).zoneId);
      
      console.log('Categorías CON zoneId:', categoriesWithZone);
      console.log('Categorías SIN zoneId:', categoriesWithoutZone);
      
      // Para cada zona, mostrar qué categorías le corresponden
      zones.forEach(zone => {
        const zoneCategories = categories.filter(cat => (cat as any).zoneId === zone.id);
        console.log(`Zona "${zone.name}" (ID: ${zone.id}) tiene ${zoneCategories.length} categorías:`, zoneCategories);
      });
      
      // Verificar si las categorías tienen el campo zoneId
      categories.forEach(cat => {
        console.log(`Categoría "${cat.name}" (ID: ${cat.id}):`, {
          leagueId: cat.leagueId,
          zoneId: (cat as any).zoneId,
          hasZoneId: !!(cat as any).zoneId
        });
      });
    }
  }, [categories, zones, leagueId]);
  
  // Set initial selected category if not set and categories exist
  React.useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);
  
  // NUEVO: Si es mundialito, ir directo a la tabla de posiciones
  useEffect(() => {
    if (league && league.id === 'mundialito') {
      setViewMode('standings');
    }
  }, [league]);
  
  if (!league) {
    return <div className="text-center py-12">Liga no encontrada</div>;
  }
  
  // Sort categories based on league
  const getYear = (cat: { name: string }) => parseInt(cat.name.split('/')[0]);
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === '2009/10') return -1;
    if (b.name === '2009/10') return 1;
    return getYear(a) - getYear(b);
  });
  
  // Mover getLeagueIcon antes de cualquier uso
  const getLeagueIcon = () => {
    switch (league.id) {
      case 'liga_masculina':
        return <Trophy size={32} className="text-primary-600" />;
      case 'lifufe':
        return <Users size={32} className="text-accent-600" />;
      case 'mundialito':
        return <ClipboardList size={32} className="text-secondary-600" />;
      default:
        return <Trophy size={32} className="text-primary-600" />;
    }
  };
  
  // NUEVO: Mostrar selector visual inicial SOLO si no es mundialito
  if (viewMode === 'init' && league.id !== 'mundialito') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <h2 className="text-2xl font-bold mb-4">¿Qué deseas ver de la liga?</h2>
        <div className="flex flex-col md:flex-row gap-6">
          <button
            className="px-8 py-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-semibold shadow-lg hover:scale-105 transition-all"
            onClick={() => setViewMode('fixture')}
          >
            Ver Fixture de la Liga
          </button>
          <button
            className="px-8 py-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-semibold shadow-lg hover:scale-105 transition-all"
            onClick={() => setViewMode('standings')}
          >
            Ver Tabla de Posiciones
          </button>
        </div>
      </div>
    );
  }

  // NUEVO: Botón para volver al selector (oculto en mundialito)
  const SelectorBackButton = () => (
    league.id !== 'mundialito' ? (
      <div className="mb-6">
        <button
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium shadow"
          onClick={() => setViewMode('init')}
        >
          ← Volver
        </button>
      </div>
    ) : null
  );

  // NUEVO: Vista de todos los fixtures de la liga
  if (viewMode === 'fixture') {
    // Obtener todos los fixtures de la liga
    const { fixtures } = useLeague();
    // Ordenar fixtures por zona y luego por fecha
    const leagueFixtures = fixtures
      .filter(f => f.leagueId === leagueId)
      .sort((a, b) => {
        // Obtener nombre de zona real
        const zonaA = zones.find(z => z.id === a.zoneId)?.name || '';
        const zonaB = zones.find(z => z.id === b.zoneId)?.name || '';
        // Si ambos tienen '1-2' o '3-4' en el nombre, ordenar por ese número
        const getZonaNum = (zona: string) => {
          const match = zona.match(/(\d+)[^\d]?(\d+)?/);
          if (!match) return 999;
          return parseInt(match[1], 10);
        };
        const numA = getZonaNum(zonaA);
        const numB = getZonaNum(zonaB);
        if (numA !== numB) return numA - numB;
        // Si zona igual, ordenar por fecha
        return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      });
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white py-10">
        <div className="w-full max-w-2xl mx-auto">
          <SelectorBackButton />
          <h2 className="text-3xl font-bold mb-8 text-center text-primary-800">Fixture de la Liga</h2>
          {leagueFixtures.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">No hay fixtures cargados para esta liga.</div>
          ) : (
            <div className="space-y-8">
              {leagueFixtures.map((fixture, fixtureIdx) => (
                <div key={fixture.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
                  {/* Header visual mejorado */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-3 rounded-t-2xl flex flex-col items-center justify-center sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
                    <div className="flex flex-col items-center sm:items-start w-full">
                      <div className="flex items-center justify-center mb-1 sm:mb-0">
                        <svg className="w-5 h-5 text-blue-100 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="4"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <h3 className="font-heading text-xl font-bold text-white text-center sm:text-left inline-block align-middle">
                          {fixture.date}
                          <span className="ml-2 text-blue-100 text-base font-normal align-middle">{fixture.matchDate ? new Date(fixture.matchDate).toLocaleDateString('es-AR') : ''}</span>
                        </h3>
                      </div>
                    </div>
                    {fixture.leyenda && (
                      <div className="mt-2 sm:mt-0 px-3 py-1 bg-white/20 rounded-full border border-white/30 flex items-center justify-center space-x-2 shadow mx-auto sm:mx-0">
                        <Newspaper className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold text-center">{fixture.leyenda}</span>
                      </div>
                    )}
                  </div>
                  {/* Zona/Texto central en pastilla */}
                  {fixture.texto_central && (
                    <div className="flex justify-center items-center py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <div className="flex items-center px-3 py-1 rounded-full bg-white shadow border border-blue-200 justify-center mx-auto">
                        <span className="text-indigo-700 font-semibold text-sm text-center">{fixture.texto_central}</span>
                      </div>
                    </div>
                  )}
                  {/* Partidos */}
                  <div className="p-3 bg-white">
                    {fixture.matches.length === 0 ? (
                      <div className="text-center py-6 text-blue-400 text-base font-semibold bg-blue-50 rounded-xl shadow-inner">
                        <ClipboardList className="mx-auto mb-2 w-7 h-7 text-blue-300" />
                        No hay partidos para este fixture.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {fixture.matches.map((match, idx) => (
                          <div key={match.id || idx} className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow hover:shadow-lg transition-shadow p-2 group">
                            <div className="grid grid-cols-12 items-center w-full">
                              <div className="flex items-center justify-center col-span-1">
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-200 text-indigo-700 font-bold text-xs shadow-inner">
                                  {idx + 1}
                                </div>
                              </div>
                              <span className="font-medium text-gray-800 text-sm text-left col-span-4 truncate">
                                {(useLeague().teams.find(t => t.id === match.homeTeamId)?.name) || 'Equipo ' + match.homeTeamId}
                              </span>
                              <span className="col-span-2 text-indigo-500 font-bold text-base text-center group-hover:scale-110 transition-transform">VS</span>
                              <span className="font-medium text-gray-800 text-sm text-right col-span-5 truncate">
                                {(useLeague().teams.find(t => t.id === match.awayTeamId)?.name) || 'Equipo ' + match.awayTeamId}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Footer informativo */}
                    <div className="mt-4 text-center text-xs text-gray-400 border-t pt-2">
                      Los horarios de los partidos pueden estar sujetos a cambios. Consulta siempre la información oficial.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // NUEVO: Vista de tabla de posiciones (igual que antes, pero con botón de volver)
  if (viewMode === 'standings') {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <SelectorBackButton />
        {/* League header */}
        <header className="flex items-center space-x-4 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
            {getLeagueIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            <p className="text-gray-600">{league.description}</p>
          </div>
        </header>
        {/* Categories/Zones y lógica de selección */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {league.id === 'liga_masculina' ? (
            zones.map((zone) => (
              <ZonePanel
                key={zone.id}
                zone={zone}
                isSelected={zone.id === selectedZoneId}
                onSelect={(zoneId, categoryId) => {
                  setSelectedZoneId(zoneId);
                  setSelectedCategoryId(categoryId);
                }}
              />
            ))
          ) : (
            sortedCategories.map((category) => (
              <CategoryPanel
                key={category.id}
                category={category}
                isSelected={category.id === selectedCategoryId}
                onSelect={(categoryId, zoneId) => {
                  setSelectedCategoryId(categoryId);
                  setSelectedZoneId(zoneId);
                }}
              />
            ))
          )}
        </div>
        {/* Render de la tabla de posiciones */}
        {selectedCategoryId && selectedZoneId ? (
          <PublicStandingsTable
            leagueId={league.id}
            zoneId={selectedZoneId}
            categoryId={selectedCategoryId}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            {league.id === 'liga_masculina'
              ? 'Selecciona una zona y categoría para ver la información'
              : 'Selecciona una categoría y zona para ver la información'}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* League header */}
      <header className="flex items-center space-x-4 pb-4 border-b">
        <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
          {getLeagueIcon()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          <p className="text-gray-600">{league.description}</p>
        </div>
      </header>

      {/* Categories/Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {league.id === 'liga_masculina' ? (
          zones.map((zone) => (
            <ZonePanel
              key={zone.id}
              zone={zone}
              isSelected={zone.id === selectedZoneId}
              onSelect={(zoneId, categoryId) => {
                setSelectedZoneId(zoneId);
                setSelectedCategoryId(categoryId);
              }}
            />
          ))
        ) : (
          // Para otras ligas: mostrar CategoryPanels (lógica existente)
          sortedCategories.map((category) => (
            <CategoryPanel
              key={category.id}
              category={category}
              isSelected={category.id === selectedCategoryId}
              onSelect={(categoryId, zoneId) => {
                setSelectedCategoryId(categoryId);
                setSelectedZoneId(zoneId);
              }}
            />
          ))
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex overflow-x-auto scrollbar-hide">
          <button
            className={cn(
              "py-3 px-4 sm:px-6 font-medium text-xs sm:text-sm focus:outline-none whitespace-nowrap flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink-0",
              activeTab === 'fixtures'
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab('fixtures')}
          >
            <ClipboardList size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Fixture</span>
            <span className="sm:hidden">Fix</span>
          </button>
          
          <button
            className={cn(
              "py-3 px-4 sm:px-6 font-medium text-xs sm:text-sm focus:outline-none whitespace-nowrap flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink-0",
              activeTab === 'standings'
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab('standings')}
          >
            <Trophy size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Tabla de Posiciones</span>
            <span className="sm:hidden">Pos</span>
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Eliminar cualquier referencia a renderContent (ya no se usa) */}
      </div>
    </div>
  );
};

export default LeaguePage;

// No necesitamos modificar más este archivo ya que el botón de exportar CSV
// está incluido directamente en el componente StandingsTable
