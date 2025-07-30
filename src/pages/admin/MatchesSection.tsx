import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Team } from '../../contexts/LeagueContext';

interface MatchesSectionProps {
  fields: any[];
  append: (field: any) => void;
  remove: (index: number) => void;
  register: any;
  errors: any;
  computedData: {
    leagueTeams: Team[];
  };
  isFormDisabled: boolean;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ fields, append, remove, register, errors, computedData, isFormDisabled }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Partidos</h3>
      <button
        type="button"
        onClick={() => append({ homeTeamId: '', awayTeamId: '' })}
        className="btn btn-secondary btn-sm flex items-center space-x-1"
        disabled={isFormDisabled}
      >
        <Plus size={16} />
        <span>Agregar Partido</span>
      </button>
    </div>
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Partido {index + 1}</h4>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-600 hover:text-red-800 p-1"
                disabled={isFormDisabled}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Equipo Local *</label>
              <select
                className={cn(
                  "form-input",
                  errors.matches?.[index]?.homeTeamId && "border-red-500"
                )}
                disabled={isFormDisabled}
                {...register(`matches.${index}.homeTeamId`, {
                  required: 'El equipo local es requerido'
                })}
              >
                <option value="">Seleccionar equipo local</option>
                {computedData.leagueTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.matches?.[index]?.homeTeamId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.matches[index]?.homeTeamId?.message}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Equipo Visitante *</label>
              <select
                className={cn(
                  "form-input",
                  errors.matches?.[index]?.awayTeamId && "border-red-500"
                )}
                disabled={isFormDisabled}
                {...register(`matches.${index}.awayTeamId`, {
                  required: 'El equipo visitante es requerido'
                })}
              >
                <option value="">Seleccionar equipo visitante</option>
                {computedData.leagueTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.matches?.[index]?.awayTeamId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.matches[index]?.awayTeamId?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MatchesSection; 