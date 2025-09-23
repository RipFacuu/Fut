import React, { useState } from 'react';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { ProdeService, MatchWithPrediction, PredictionType } from '../../services/prodeService';
import { cn } from '../../utils/cn';

interface ProdeMatchCardProps {
  match: MatchWithPrediction;
  onPredictionUpdate: () => void;
  className?: string;
}

export const ProdeMatchCard: React.FC<ProdeMatchCardProps> = ({ 
  match, 
  onPredictionUpdate, 
  className 
}) => {
  const { user } = useUserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [scoreHome, setScoreHome] = useState<string>('');
  const [scoreAway, setScoreAway] = useState<string>('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeadline = (deadlineString: string) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return '⏰ Cerrado';
    } else if (diffMins < 60) {
      return `⏰ ${diffMins} min`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `⏰ ${diffHours}h ${diffMins % 60}min`;
    }
  };

  const getPredictionButtonClass = (prediction: PredictionType) => {
    const baseClass = "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200";
    
    if (match.user_prediction === prediction) {
      return cn(baseClass, "bg-blue-600 text-white shadow-lg scale-105");
    }
    
    return cn(
      baseClass,
      "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105",
      "border-2 border-transparent hover:border-blue-300"
    );
  };

  const getResultClass = () => {
    if (!match.resultado_local || !match.resultado_visitante) {
      return "text-gray-500";
    }
    
    const localWins = match.resultado_local > match.resultado_visitante;
    const visitanteWins = match.resultado_visitante > match.resultado_local;
    
    if (localWins) return "text-green-600 font-bold";
    if (visitanteWins) return "text-blue-600 font-bold";
    return "text-yellow-600 font-bold";
  };

  const getResultText = () => {
    if (!match.resultado_local || !match.resultado_visitante) {
      return "Sin resultado";
    }
    
    return `${match.resultado_local} - ${match.resultado_visitante}`;
  };

  const handlePrediction = async (prediction: PredictionType) => {
    if (!user || !match.can_predict) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      
      const amt = betAmount ? Number(betAmount) : undefined;
      const sh = scoreHome ? Number(scoreHome) : undefined;
      const sa = scoreAway ? Number(scoreAway) : undefined;
      if (match.user_prediction) {
        result = await ProdeService.updatePrediction(user.id, match.id, prediction, amt, sh, sa);
        setSuccess('¡Predicción actualizada!');
      } else {
        result = await ProdeService.createPrediction(user.id, match.id, prediction, amt, sh, sa);
        setSuccess('¡Predicción guardada!');
      }

      if (result) {
        onPredictionUpdate();
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Error al guardar la predicción');
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!match.can_predict) return "🔒";
    if (match.user_prediction) return "✅";
    return "⚽";
  };

  const getStatusText = () => {
    if (!match.can_predict) return "Cerrado";
    if (match.user_prediction) return "Predicho";
    return "Sin predicción";
  };

  const getStatusClass = () => {
    if (!match.can_predict) return "bg-red-100 text-red-800";
    if (match.user_prediction) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500",
      !match.can_predict && "opacity-75",
      className
    )}>
      {/* Header del partido */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {formatDate(match.fecha)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {match.zona.nombre}
          </span>
        </div>
        
        <div className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          getStatusClass()
        )}>
          {getStatusIcon()} {getStatusText()}
        </div>
      </div>

      {/* Información del Fixture */}
      {match.fixture_info && (
        <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-blue-800">{match.fixture_info.nombre}</span>
              {match.fixture_info.leyenda && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {match.fixture_info.leyenda}
                </span>
              )}
            </div>
            <div className="text-blue-600 font-medium">
              {match.fixture_info.fecha_partido}
            </div>
          </div>
          {match.fixture_info.texto_central && (
            <div className="mt-1 text-xs text-blue-600 italic">
              {match.fixture_info.texto_central}
            </div>
          )}
        </div>
      )}

      {/* Equipos */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Equipo Local */}
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {match.equipo_local.nombre}
          </div>
          <div className="text-xs text-gray-500">Local</div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className="text-2xl font-bold text-gray-400">VS</div>
        </div>

        {/* Equipo Visitante */}
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {match.equipo_visitante.nombre}
          </div>
          <div className="text-xs text-gray-500">Visitante</div>
        </div>
      </div>

      {/* Resultado (si existe) */}
      {(match.resultado_local || match.resultado_visitante) && (
        <div className="text-center mb-4">
          <div className={cn("text-lg font-bold", getResultClass())}>
            {getResultText()}
          </div>
          <div className="text-xs text-gray-500">Resultado Final</div>
        </div>
      )}

      {/* Predicciones del usuario */}
      {user && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Tu predicción:
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Monto"
              className="form-input text-sm"
            />
            <input
              type="number"
              min="0"
              value={scoreHome}
              onChange={(e) => setScoreHome(e.target.value)}
              placeholder="Goles Local"
              className="form-input text-sm"
            />
            <input
              type="number"
              min="0"
              value={scoreAway}
              onChange={(e) => setScoreAway(e.target.value)}
              placeholder="Goles Visitante"
              className="form-input text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePrediction('local')}
              disabled={isLoading || !match.can_predict}
              className={getPredictionButtonClass('local')}
            >
              🏠 Local
            </button>
            
            <button
              onClick={() => handlePrediction('empate')}
              disabled={isLoading || !match.can_predict}
              className={getPredictionButtonClass('empate')}
            >
              🤝 Empate
            </button>
            
            <button
              onClick={() => handlePrediction('visitante')}
              disabled={isLoading || !match.can_predict}
              className={getPredictionButtonClass('visitante')}
            >
              🚌 Visitante
            </button>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 text-green-700 rounded text-sm">
          ✅ {success}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDeadline(match.prediction_deadline)}</span>
        
        {match.user_prediction && (
          <span className="text-blue-600 font-medium">
            Predicción: {match.user_prediction === 'local' ? '🏠 Local' : 
                         match.user_prediction === 'empate' ? '🤝 Empate' : '🚌 Visitante'}
          </span>
        )}
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
