import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';
import { Fixture } from '../../contexts/LeagueContext';

interface FixtureListProps {
  fixtures: Fixture[];
  isLoading: boolean;
  selectedLeague: string;
  onEdit: (fixtureId: string) => void;
  onDelete: (fixtureId: string) => void;
  getTeamName: (teamId: string) => string;
}

const FixtureList: React.FC<FixtureListProps> = ({
  fixtures,
  isLoading,
  selectedLeague,
  onEdit,
  onDelete,
  getTeamName
}) => {
  const [expanded, setExpanded] = useState(new Set());
  const [loadingMatches, setLoadingMatches] = useState({}); // { [fixtureId]: boolean }
  const [matchesByFixture, setMatchesByFixture] = useState({}); // { [fixtureId]: Match[] }

  const toggleExpand = (fixtureId) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fixtureId)) {
        newSet.delete(fixtureId);
      } else {
        newSet.add(fixtureId);
        // Lazy load matches if not loaded
        if (!matchesByFixture[fixtureId]) {
          setLoadingMatches(lm => ({ ...lm, [fixtureId]: true }));
          // Simular fetch de partidos (reemplazar por fetch real si tienes endpoint)
          setTimeout(() => {
            const fixture = fixtures.find(f => f.id === fixtureId);
            setMatchesByFixture(mbf => ({ ...mbf, [fixtureId]: fixture?.matches || [] }));
            setLoadingMatches(lm => ({ ...lm, [fixtureId]: false }));
          }, 600); // Simula retardo de red
        }
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Cargando fixtures...</p>
      </div>
    );
  }

  if (!selectedLeague) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Selecciona una liga para ver los fixtures</p>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No hay fixtures para la liga seleccionada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fixtures.map(fixture => {
        const isOpen = expanded.has(fixture.id);
        const isLoadingMatches = loadingMatches[fixture.id];
        const matches = matchesByFixture[fixture.id] || [];
        return (
          <div key={fixture.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => toggleExpand(fixture.id)}>
              <div className="flex items-center space-x-2">
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <h3 className="font-semibold text-lg">{fixture.date}</h3>
                <span className="text-sm text-gray-600">{formatLocalDate(fixture.matchDate)}</span>
                {fixture.leyenda && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{fixture.leyenda}</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={e => { e.stopPropagation(); onEdit(fixture.id); }}
                  className="btn btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Edit size={16} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(fixture.id); }}
                  className="btn btn-danger btn-sm flex items-center space-x-1"
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
            {fixture.texto_central && (
              <div className="mb-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                {fixture.texto_central}
              </div>
            )}
            {isOpen && (
              <div className="space-y-2 transition-all duration-200">
                {isLoadingMatches ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
                    <span className="text-blue-600">Cargando partidos...</span>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-gray-500 text-center py-2">No hay partidos para este fixture.</div>
                ) : (
                  matches
                    .filter(match =>
                      match.homeTeamId &&
                      match.awayTeamId &&
                      getTeamName(match.homeTeamId) !== 'Equipo desconocido' &&
                      getTeamName(match.awayTeamId) !== 'Equipo desconocido'
                    )
                    .map((match, index) => (
                      <div key={match.id || index} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">{getTeamName(match.homeTeamId)}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium">{getTeamName(match.awayTeamId)}</span>
                          </div>
                          {match.played && match.homeScore !== undefined && match.awayScore !== undefined && (
                            <div className="text-sm font-medium text-green-600">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FixtureList; 