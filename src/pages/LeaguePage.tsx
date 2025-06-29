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
  
  if (!league) {
    return <div className="text-center py-12">Liga no encontrada</div>;
  }
  
  // Sort categories based on league
  const sortedCategories = [...categories].sort((a) => {
    if (league.id === 'liga_masculina') {
      // Para Liga Masculina, las categorías vienen primero
      return a.name.toLowerCase().includes('zona') ? 1 : -1;
    } else {
      // Para otras ligas, las zonas vienen primero
      return a.name.toLowerCase().includes('zona') ? -1 : 1;
    }
  });
  
  const renderContent = () => {
    if (!selectedCategoryId || !selectedZoneId) {
      return (
        <div className="text-center py-12 text-gray-500">
          {league.id === 'liga_masculina'
            ? 'Selecciona una zona y categoría para ver la información'
            : 'Selecciona una categoría y zona para ver la información'}
        </div>
      );
    }
    
    if (isLoading && activeTab === 'fixtures') {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Cargando fixtures...</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'fixtures':
        return <FixtureList zoneId={selectedZoneId} />;
      case 'results':
        return <FixtureList zoneId={selectedZoneId} resultsOnly={true} />;
      case 'standings':
        return (
          selectedZoneId && selectedCategoryId ? (
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
          )
        );
      case 'teams':
        return <TeamList zoneId={selectedZoneId} />;
      default:
        return null;
    }
  };
  
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
          
          {/* NUEVA PESTAÑA DE RESULTADOS */}
          <button
            className={cn(
              "py-3 px-4 sm:px-6 font-medium text-xs sm:text-sm focus:outline-none whitespace-nowrap flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink-0",
              activeTab === 'results'
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab('results')}
          >
            <Newspaper size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Resultados</span>
            <span className="sm:hidden">Res</span>
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
        {renderContent()}
      </div>
    </div>
  );
};

export default LeaguePage;

// No necesitamos modificar más este archivo ya que el botón de exportar CSV
// está incluido directamente en el componente StandingsTable
