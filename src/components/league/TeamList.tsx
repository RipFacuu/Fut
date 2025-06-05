import React from 'react';
import { useLeague, Team } from '../../contexts/LeagueContext';
import { Users } from 'lucide-react';

interface TeamListProps {
  zoneId: string;
}

const TeamList: React.FC<TeamListProps> = ({ zoneId }) => {
  const { getTeamsByZone } = useLeague();
  
  // Get teams for this zone
  const teams = getTeamsByZone(zoneId);
  
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay equipos en esta zona
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((team: Team) => (
        <div 
          key={team.id} 
          className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-4 flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              {team.logo ? (
                <img 
                  src={team.logo} 
                  alt={`${team.name} logo`} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Users size={24} className="text-primary-600" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">{team.name}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;