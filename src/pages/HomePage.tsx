import React from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import { Trophy, Users, ClipboardList, Star, Zap, Target, Award, ArrowRight } from 'lucide-react';
import FlyerCarousel from '../components/FlyerCarousel';

import { getLeagueDefaultLogo } from '../utils/leagueUtils';

const HomePage: React.FC = () => {
  const { leagues } = useLeague();
  
  // Debug: Log todas las ligas disponibles
  console.log('Ligas disponibles:', leagues.map(league => ({ id: league.id, name: league.name, logo: league.logo })));
  
  // Ordenar: primero las conocidas, luego el resto por id ascendente
  const knownOrder = ['liga_masculina', 'lifufe', 'mundialito'];
  const orderedLeagues = [
    ...knownOrder.map(id => leagues.find(l => l.id === id)).filter(Boolean),
    ...leagues.filter(l => !knownOrder.includes(l.id)).sort((a, b) => {
      const idA = isNaN(Number(a.id)) ? 999 : Number(a.id);
      const idB = isNaN(Number(b.id)) ? 999 : Number(b.id);
      return idA - idB;
    })
  ];

  // Función para obtener la imagen de la liga
  const getLeagueLogo = (league: any) => {
    return league.logo || getLeagueDefaultLogo(league.id, league.name);
  };
  
  return (
    <div className="space-y-12 px-4 sm:px-8">
      {/* Carrusel de Flyers */}
      <section className="animate-fade-in max-w-5xl mx-auto px-4 sm:px-8">
        <FlyerCarousel />
      </section>

      {/* League Panels con efectos modernos */}
      <section className="animate-fade-in max-w-5xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text leading-[1.35] pb-3">
            Nuestras Ligas
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Descubre todas las competiciones que tenemos para ti
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {orderedLeagues.map((league, index) => {
            if (!league) return null;
            const logoSrc = getLeagueLogo(league);
            
            return (
              <Link 
                key={league.id} 
                to={`/league/${league.id}`}
                className="league-panel group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                      
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center relative overflow-hidden">
                        {logoSrc ? (
                          <img 
                            src={logoSrc} 
                            alt={league.name} 
                            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-300" 
                          />
                        ) : (
                          <Trophy className="text-gray-400" size={48} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-center mb-3 group-hover:text-primary-600 transition-colors duration-300">
                    {league.name}
                  </h3>
                  
                  <p className="text-slate-600 text-center mb-6 leading-relaxed">
                    {league.description}
                  </p>
                  
                  <div className="text-center">
                    <span className="inline-flex items-center px-6 py-3 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors duration-300 group-hover:scale-105">
                      Ver detalles
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      
      {/* Features Section con diseño moderno */}
      <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 p-8 md:p-12 rounded-3xl shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 rounded-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Lo que ofrecemos
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            toda la información que necesitas de tu liga
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <ClipboardList size={32} className="text-white" />
                </div>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-800">Fixtures</h3>
              <p className="text-slate-600 leading-relaxed">
                Programa completo de todos los partidos organizados por fecha con información detallada.
              </p>
            </div>
            
            <div className="text-center group animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Trophy size={32} className="text-white" />
                </div>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-800">Resultados</h3>
              <p className="text-slate-600 leading-relaxed">
                Resultados actualizados de todos los partidos disputados con estadísticas completas.
              </p>
            </div>
            
            <div className="text-center group animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Users size={32} className="text-white" />
                </div>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-800">Equipos</h3>
              <p className="text-slate-600 leading-relaxed">
                Información detallada de los equipos participantes en cada liga con sus jugadores.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
