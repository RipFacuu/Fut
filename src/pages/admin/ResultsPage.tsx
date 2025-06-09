import React, { useState, useEffect } from 'react';
import { useLeague, Match, Fixture, Team } from '../../contexts/LeagueContext';
import { Edit, Save, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ResultsPage: React.FC = () => {
  const { 
    leagues, 
    fixtures, 
    teams,
    updateMatchResult, 
    getCategoriesByLeague, 
    getZonesByCategory 
  } = useLeague();
  
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  
  // Get categories for selected league
  const leagueCategories = selectedLeague ? getCategoriesByLeague(selectedLeague) : [];
  
  // Get zones for selected category
  const categoryZones = selectedCategory ? getZonesByCategory(selectedCategory) : [];
  
  // Filter fixtures by selections
  const filteredFixtures = fixtures.filter(fixture => {
    let match = true;
    if (selectedLeague) match = match && fixture.leagueId === selectedLeague;
    if (selectedCategory) match = match && fixture.categoryId === selectedCategory;
    if (selectedZone) match = match && fixture.zoneId === selectedZone;
    return match;
  });
  
  // Inicializar liga automáticamente cuando las ligas estén disponibles
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeague) {
      const leagueWithFixtures = leagues.find(league => 
        fixtures.some(fixture => fixture.leagueId === league.id)
      );
      const targetLeague = leagueWithFixtures || leagues[0];
      if (targetLeague) {
        setSelectedLeague(targetLeague.id);
      }
    }
  }, [leagues, fixtures, selectedLeague]);
  
  // Inicializar categoría automáticamente cuando las categorías estén disponibles
  useEffect(() => {
    if (leagueCategories.length > 0 && selectedLeague && !selectedCategory) {
      const categoryWithFixtures = leagueCategories.find(category => 
        fixtures.some(fixture => 
          fixture.leagueId === selectedLeague && fixture.categoryId === category.id
        )
      );
      const targetCategory = categoryWithFixtures || leagueCategories[0];
      if (targetCategory) {
        setSelectedCategory(targetCategory.id);
      }
    }
  }, [leagueCategories, selectedLeague, fixtures, selectedCategory]);
  
  // Inicializar zona automáticamente cuando las zonas estén disponibles
  useEffect(() => {
    if (categoryZones.length > 0 && selectedLeague && selectedCategory && !selectedZone) {
      const zoneWithFixtures = categoryZones.find(zone => 
        fixtures.some(fixture => 
          fixture.leagueId === selectedLeague && 
          fixture.categoryId === selectedCategory && 
          fixture.zoneId === zone.id
        )
      );
      const targetZone = zoneWithFixtures || categoryZones[0];
      if (targetZone) {
        setSelectedZone(targetZone.id);
      }
    }
  }, [categoryZones, selectedLeague, selectedCategory, fixtures, selectedZone]);
  
  const handleEditClick = (match: Match) => {
    setEditingMatch(match.id);
    setHomeScore(match.homeScore?.toString() || '');
    setAwayScore(match.awayScore?.toString() || '');
  };
  
  const handleCancelClick = () => {
    setEditingMatch(null);
    setHomeScore('');
    setAwayScore('');
  };
  
  const handleSaveClick = async (matchId: string) => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);
    
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      alert('Por favor ingresa resultados válidos (números enteros positivos)');
      return;
    }
    
    try {
      await updateMatchResult(matchId, home, away);
      setEditingMatch(null);
      setHomeScore('');
      setAwayScore('');
      console.log('Resultado guardado exitosamente');
    } catch (error) {
      console.error('Error guardando resultado:', error);
      alert('Error al guardar el resultado. Por favor intenta de nuevo.');
    }
  };
  
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    // Reset dependent selections when league changes
    setSelectedCategory('');
    setSelectedZone('');
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    // Reset zone when category changes
    setSelectedZone('');
  };
  
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
  };
  
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  };
  
  const getMatchDetails = (match: Match): { homeTeam: string, awayTeam: string } => {
    const homeTeam = getTeamName(match.homeTeamId);
    const awayTeam = getTeamName(match.awayTeamId);
    
    return { homeTeam, awayTeam };
  };
  
  // Debug: Agregar logs para ver el estado
  console.log('Debug ResultsPage:', {
    leagues: leagues.length,
    fixtures: fixtures.length,
    teams: teams.length,
    selectedLeague,
    selectedCategory,
    selectedZone,
    leagueCategories: leagueCategories.length,
    categoryZones: categoryZones.length,
    filteredFixtures: filteredFixtures.length
  });
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resultados</h1>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="leagueFilter" className="form-label">
            Liga
          </label>
          <select
            id="leagueFilter"
            className="form-input"
            value={selectedLeague}
            onChange={handleLeagueChange}
          >
            <option value="">Seleccionar liga</option>
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="categoryFilter" className="form-label">
            Categoría
          </label>
          <select
            id="categoryFilter"
            className="form-input"
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={!selectedLeague}
          >
            <option value="">Seleccionar categoría</option>
            {leagueCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="zoneFilter" className="form-label">
            Zona
          </label>
          <select
            id="zoneFilter"
            className="form-input"
            value={selectedZone}
            onChange={handleZoneChange}
            disabled={!selectedCategory}
          >
            <option value="">Seleccionar zona</option>
            {categoryZones.map(zone => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Loading State */}
      {leagues.length === 0 || fixtures.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando...</h3>
          <p className="text-gray-500">
            Cargando datos desde Supabase...
          </p>
        </div>
      ) : !selectedLeague ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una liga</h3>
          <p className="text-gray-500">
            Selecciona una liga para comenzar.
          </p>
        </div>
      ) : !selectedCategory ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una categoría</h3>
          <p className="text-gray-500">
            Selecciona una categoría para continuar.
          </p>
        </div>
      ) : !selectedZone ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una zona</h3>
          <p className="text-gray-500">
            Selecciona una zona para ver los fixtures.
          </p>
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fixtures</h3>
          <p className="text-gray-500">
            No hay fixtures disponibles para esta selección.
          </p>
        </div>
      ) : (
        /* Fixtures List */
        <div className="space-y-6">
          {filteredFixtures.map((fixture: Fixture) => (
            <div key={fixture.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-semibold text-lg">{fixture.date}</h3>
                <p className="text-gray-500 text-sm">{fixture.matchDate}</p>
              </div>
              
              <div className="divide-y">
                {fixture.matches.map((match: Match) => {
                  const { homeTeam, awayTeam } = getMatchDetails(match);
                  
                  return (
                    <div 
                      key={match.id} 
                      className={cn(
                        "p-4",
                        editingMatch === match.id && "bg-blue-50"
                      )}
                    >
                      {editingMatch === match.id ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-4">
                            <p className="font-medium mb-1 text-gray-800">{homeTeam}</p>
                            <input
                              type="number"
                              min="0"
                              className="form-input w-20 text-center"
                              value={homeScore}
                              onChange={(e) => setHomeScore(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-center min-w-[60px]">
                            <span className="text-2xl font-bold text-gray-600">VS</span>
                          </div>
                          
                          <div className="flex-1 text-left pl-4">
                            <p className="font-medium mb-1 text-gray-800">{awayTeam}</p>
                            <input
                              type="number"
                              min="0"
                              className="form-input w-20 text-center"
                              value={awayScore}
                              onChange={(e) => setAwayScore(e.target.value)}
                            />
                          </div>
                          
                          <div className="ml-6 flex space-x-2">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveClick(match.id)}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={handleCancelClick}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-2">
                          <div className="flex-1 text-right pr-6">
                            <p className="font-semibold text-lg text-gray-800">{homeTeam}</p>
                          </div>
                          
                          <div className="flex items-center justify-center min-w-[120px] px-4">
                            {match.played ? (
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-xl px-3 py-2 bg-blue-100 text-blue-800 rounded-lg min-w-[40px] text-center shadow-sm">
                                  {match.homeScore}
                                </span>
                                <span className="text-2xl font-bold text-gray-400">-</span>
                                <span className="font-bold text-xl px-3 py-2 bg-blue-100 text-blue-800 rounded-lg min-w-[40px] text-center shadow-sm">
                                  {match.awayScore}
                                </span>
                              </div>
                            ) : (
                              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">Sin resultado</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 text-left pl-6">
                            <p className="font-semibold text-lg text-gray-800">{awayTeam}</p>
                          </div>
                          
                          <div className="ml-6">
                            <button
                              className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm border border-indigo-200 hover:border-indigo-300"
                              onClick={() => handleEditClick(match)}
                              disabled={!!editingMatch}
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;