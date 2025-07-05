import React from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Users, Calendar, Star, Zap } from 'lucide-react';

const LeagueHeader: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();

  const getLeagueInfo = (id: string) => {
    switch (id) {
      case 'liga_masculina':
        return {
          name: 'Liga Participando',
          description: 'La liga más importante de fútbol masculino',
          icon: Trophy,
          color: 'from-primary-500 to-primary-600',
          bgColor: 'from-primary-600 via-accent-600 to-primary-700',
          stats: [
            { label: 'Equipos', value: '20', icon: Users },
            { label: 'Fecha', value: '15', icon: Calendar },
            { label: 'Puntos', value: '45', icon: Star }
          ]
        };
      case 'lifufe':
        return {
          name: 'LIFUFE',
          description: 'Liga de Fútbol Femenino',
          icon: Star,
          color: 'from-accent-500 to-accent-600',
          bgColor: 'from-accent-600 via-purple-600 to-accent-700',
          stats: [
            { label: 'Equipos', value: '12', icon: Users },
            { label: 'Fecha', value: '10', icon: Calendar },
            { label: 'Puntos', value: '30', icon: Star }
          ]
        };
      case 'mundialito':
        return {
          name: 'Mundialito',
          description: 'Torneo especial de verano',
          icon: Zap,
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'from-yellow-600 via-orange-600 to-yellow-700',
          stats: [
            { label: 'Equipos', value: '8', icon: Users },
            { label: 'Fecha', value: '5', icon: Calendar },
            { label: 'Puntos', value: '15', icon: Star }
          ]
        };
      default:
        return {
          name: 'Liga',
          description: 'Liga de fútbol',
          icon: Trophy,
          color: 'from-primary-500 to-primary-600',
          bgColor: 'from-primary-600 via-accent-600 to-primary-700',
          stats: [
            { label: 'Equipos', value: '0', icon: Users },
            { label: 'Fecha', value: '0', icon: Calendar },
            { label: 'Puntos', value: '0', icon: Star }
          ]
        };
    }
  };

  const leagueInfo = getLeagueInfo(leagueId || '');

  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 text-white overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
      
      {/* Partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse opacity-25"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Información principal */}
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${leagueInfo.color} rounded-full blur-xl opacity-75 animate-pulse`}></div>
                <div className={`relative w-16 h-16 bg-gradient-to-r ${leagueInfo.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <leagueInfo.icon size={32} className="text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                  {leagueInfo.name}
                </h1>
                <p className="text-white/80 text-sm md:text-base mt-1">
                  {leagueInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex space-x-6">
            {leagueInfo.stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${leagueInfo.color} rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
                  <div className={`relative w-12 h-12 bg-gradient-to-r ${leagueInfo.color} rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-white/70 text-xs font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="mt-6 flex justify-center lg:justify-start">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/90 text-sm font-medium">Liga Activa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueHeader;