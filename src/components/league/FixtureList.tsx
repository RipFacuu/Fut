import React from 'react';
import { useLeague, Fixture, Team } from '../../contexts/LeagueContext';

interface FixtureListProps {
  zoneId: string;
  resultsOnly?: boolean;
}

const FixtureList: React.FC<FixtureListProps> = ({ zoneId, resultsOnly = false }) => {
  const { getFixturesByZone, teams } = useLeague();
  
  // Get fixtures for this zone
  const fixtures = getFixturesByZone(zoneId);
  
  // AGREGAR ESTE LOG TEMPORAL
  console.log('FixtureList - zoneId:', zoneId);
  console.log('FixtureList - fixtures found:', fixtures);
  
  // If resultsOnly is true, filter fixtures to only include those with played matches
  const filteredFixtures = resultsOnly
    ? fixtures.filter(fixture => 
        fixture.matches.some(match => match.played)
      )
    : fixtures;
  
  // Get team name by ID
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
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
            <h3 className="font-heading text-lg font-semibold text-gray-800">
              {fixture.date}
              <span className="ml-2 text-gray-500 text-sm font-normal">
                {fixture.matchDate}
              </span>
            </h3>
          </div>
          
          <div className="p-2">
            {fixture.matches.filter(match => !resultsOnly || match.played).map(match => (
              <div 
                key={match.id} 
                className="py-3 px-2 border-b last:border-0 flex items-center justify-between"
              >
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FixtureList;