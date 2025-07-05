import React from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import { Trophy, Users, ClipboardList, Star, Zap, Target, Award } from 'lucide-react';

const HomePage: React.FC = () => {
  const { leagues } = useLeague();
  
  return (
    <div className="space-y-12 px-4 sm:px-8">
      {/* Hero Section ancho igual a Nuestras Ligas */}
      <section className="relative bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl py-4 sm:py-6 md:py-8 max-w-5xl mx-auto mt-2 mb-4">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-black/10 to-black/20"></div>
        {/* Partículas flotantes (opcional) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse opacity-40"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse opacity-50"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex justify-center mb-2 sm:mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
              <Trophy size={28} className="relative text-white drop-shadow-2xl animate-bounce-gentle" />
            </div>
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 leading-tight">
            Bienvenido a <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Liga Participando</span>
          </h1>
          <p className="text-white/85 text-xs xs:text-sm sm:text-base max-w-md mb-3 sm:mb-4">
            La plataforma oficial para seguir todas las competiciones, resultados y estadísticas de nuestras ligas de fútbol profesional.
          </p>
          <div className="flex flex-col xs:flex-row gap-1 xs:gap-2 sm:gap-3 w-full max-w-xs mx-auto">
            <Link 
              to="/league/liga_masculina"
              className="btn btn-primary flex-1 flex items-center justify-center text-sm xs:text-base px-3 py-1.5 xs:px-4 xs:py-2 group min-w-0"
            >
              <Trophy className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={16} />
              Liga Participando
            </Link>
            <Link 
              to="/league/lifufe" 
              className="btn btn-accent flex-1 flex items-center justify-center text-sm xs:text-base px-3 py-1.5 xs:px-4 xs:py-2 group min-w-0"
            >
              <Star className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={16} />
              LIFUFE
            </Link>
            <Link 
              to="/league/mundialito" 
              className="btn btn-outline flex-1 flex items-center justify-center text-sm xs:text-base px-3 py-1.5 xs:px-4 xs:py-2 group min-w-0 bg-white/90 hover:bg-white"
            >
              <Zap className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={16} />
              Mundialito
            </Link>
          </div>
        </div>
      </section>

      {/* League Panels con efectos modernos */}
      <section className="animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Nuestras Ligas
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Descubre todas las competiciones que tenemos para ti
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leagues.map((league, index) => (
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
          ))}
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
              Todo lo que necesitas para seguir el fútbol profesional
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