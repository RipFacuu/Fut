import React, { useState, useEffect } from 'react';
import { useLeague, Fixture, } from '../../contexts/LeagueContext';
import { cn } from '../../utils/cn';

interface FixtureListProps {
  zoneId: string;
  resultsOnly?: boolean;
}

const FixtureList: React.FC<FixtureListProps> = ({ zoneId, resultsOnly = false }) => {
  const { getFixturesByZone, teams, fixtures: allFixtures } = useLeague();
  
  // ENHANCED LOGS FOR DEBUGGING
  console.log('=== FIXTURE LIST DEBUG ===');
  console.log('zoneId received:', zoneId, 'type:', typeof zoneId);
  console.log('resultsOnly:', resultsOnly);
  console.log('all fixtures:', allFixtures?.map(f => ({
    id: f.id,
    zoneId: f.zoneId,
    zoneIdType: typeof f.zoneId,
    date: f.date,
    matchesCount: f.matches.length,
    playedMatches: f.matches.filter(m => m.played).length
  })));
  
  // Get fixtures for this zone
  const fixtures = getFixturesByZone(zoneId);
  
  console.log('fixtures found for zone:', fixtures);
  console.log('fixtures length:', fixtures.length);
  
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // If resultsOnly is true, filter fixtures to only include those with played matches
  const filteredFixtures = resultsOnly
    ? fixtures.filter(fixture => 
        fixture.matches.some(match => match.played)
      )
    : fixtures;
  
  // Get team name by ID
  // Reemplazar la función getTeamName existente por esta:
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    if (team) {
      return team.name;
    }
    
    return `Equipo ${teamId}`;
  };
  
  if (filteredFixtures.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {resultsOnly 
          ? 'No hay resultados disponibles para esta zona'
          : 'No hay fixture disponible para esta zona'}
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {filteredFixtures.map((fixture: Fixture) => (
        <div key={fixture.id} className="fixture-card">
          <div className="bg-gray-50 p-3 rounded-t-lg border-b">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-gray-800">
              {fixture.date}
              <span className="ml-2 text-gray-500 text-xs sm:text-sm font-normal">
                {fixture.matchDate}
              </span>
            </h3>
          </div>
          
          <div className="p-2">
            {fixture.matches.filter(match => !resultsOnly || match.played).map(match => (
              <div 
                key={match.id} 
                className={cn(
                  "py-3 px-2 border-b last:border-0",
                  isMobile ? "flex flex-col space-y-2" : "flex items-center justify-between"
                )}
              >
                {isMobile ? (
                  // Vista móvil
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{getTeamName(match.homeTeamId)}</span>
                      <span className="font-medium text-sm">{getTeamName(match.awayTeamId)}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      {match.played ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold px-3 py-2 bg-gray-100 rounded-md text-lg">
                            {match.homeScore}
                          </span>
                          <span className="text-lg">-</span>
                          <span className="font-bold px-3 py-2 bg-gray-100 rounded-md text-lg">
                            {match.awayScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-500 py-2">VS</span>
                      )}
                    </div>
                  </>
                ) : (
                  // Vista desktop (código existente)
                  <>
                    <div className="flex-1 text-right pr-3">
                      <span className="font-medium">{getTeamName(match.homeTeamId)}</span>
                    </div>
                    
                    <div className="flex items-center justify-center w-20">
                      {match.played ? (
                        <div className="flex items-center justify-center">
                          <span className="font-bold px-2 py-1 bg-gray-100 rounded-md min-w-[32px] text-center">
                            {match.homeScore}
                          </span>
                          <span className="mx-1">-</span>
                          <span className="font-bold px-2 py-1 bg-gray-100 rounded-md min-w-[32px] text-center">
                            {match.awayScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-500">VS</span>
                      )}
                    </div>
                    
                    <div className="flex-1 pl-3">
                      <span className="font-medium">{getTeamName(match.awayTeamId)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FixtureList;