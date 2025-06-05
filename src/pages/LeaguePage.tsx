import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import CategoryPanel from '../components/league/CategoryPanel';
import FixtureList from '../components/league/FixtureList';
import StandingsTable from '../components/league/StandingsTable';
import TeamList from '../components/league/TeamList';
import { Trophy, Users, ClipboardList, Newspaper } from 'lucide-react';
import { cn } from '../utils/cn';

type Tab = 'fixtures' | 'results' | 'standings' | 'teams';

const LeaguePage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { getLeague, getCategoriesByLeague } = useLeague();
  const [activeTab, setActiveTab] = useState<Tab>('fixtures');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
  // Get league data
  const league = getLeague(leagueId || '');
  
  // Get categories for this league
  const categories = getCategoriesByLeague(leagueId || '');
  
  // Set initial selected category if not set and categories exist
  React.useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);
  
  if (!league) {
    return <div className="text-center py-12">Liga no encontrada</div>;
  }
  
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
    
    switch (activeTab) {
      case 'fixtures':
        return <FixtureList zoneId={selectedZoneId} />;
      case 'results':
        return <FixtureList zoneId={selectedZoneId} resultsOnly={true} />;
      case 'standings':
        return <StandingsTable zoneId={selectedZoneId} />;
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
  
  // Sort categories based on league
  const sortedCategories = [...categories].sort((a, b) => {
    if (league.id === 'liga_masculina') {
      // Para Liga Masculina, las categorías vienen primero
      return a.name.toLowerCase().includes('zona') ? 1 : -1;
    } else {
      // Para otras ligas, las zonas vienen primero
      return a.name.toLowerCase().includes('zona') ? -1 : 1;
    }
  });
  
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
      
      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedCategories.map((category) => (
          <CategoryPanel
            key={category.id}
            category={category}
            isSelected={category.id === selectedCategoryId}
            onSelect={(categoryId, zoneId) => {
              setSelectedCategoryId(categoryId);
              setSelectedZoneId(zoneId);
            }}
          />
        ))}
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex overflow-x-auto">
          <button
            className={cn(
              "py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap flex items-center space-x-2",
              activeTab === 'fixtures'
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab('fixtures')}
          >
            <ClipboardList size={18} />
            <span>Fixture</span>
          </button>
          <button
            className={cn(
              "py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap flex items-center space-x-2",
              activeTab === 'standings'
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab('standings')}
          >
            <Trophy size={18} />
            <span>Tabla de Posiciones</span>
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