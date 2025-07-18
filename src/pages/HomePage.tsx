import React from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import { Trophy, Users, ClipboardList, Star, Zap, Target, Award } from 'lucide-react';
import FlyerCarousel from '../components/FlyerCarousel';

const HomePage: React.FC = () => {
  const { leagues } = useLeague();
  
  // Mostrar todas las ligas, no solo las predefinidas
  const orderedLeagues = leagues;
  
  return (
    <div className="space-y-12 px-4 sm:px-8">
      {/* Hero principal oculto */}
      <section className="hidden">
        {/* ...hero... */}
      </section>

      {/* Hero Section ancho igual a Nuestras Ligas */}
      {/* Sección eliminada por pedido del usuario */}

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
                      {/* Mostrar imagen solo para ligas conocidas, si no mostrar ícono por defecto */}
                      {league.id === 'liga_masculina' && (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center relative">
                          <img src="/liga_participando.jpeg" alt="Liga Masculina" className="w-24 h-24 object-cover rounded-full scale-110 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                      )}
                      {league.id === 'lifufe' && (
                        <div className="w-24 h-24 bg-gradient-to-br from-accent-100 to-accent-200 rounded-full flex items-center justify-center relative">
                          <img src="/lifufe.jpeg" alt="LIFUFE" className="w-24 h-24 object-cover rounded-full scale-110 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                      )}
                      {league.id === 'mundialito' && (
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center relative">
                          <img src="/mundialito.jpeg" alt="Mundialito" className="w-24 h-24 object-cover rounded-full scale-110 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                      )}
                      {/* Para ligas nuevas, mostrar un ícono por defecto */}
                      {league.id !== 'liga_masculina' && league.id !== 'lifufe' && league.id !== 'mundialito' && (
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center relative">
                          <span className="text-4xl text-gray-400 font-bold">{league.name[0]?.toUpperCase() || '?'}</span>
                        </div>
                      )}
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

// Componente ArrowRight para el botón
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default HomePage;