import React from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';
import { Trophy, Users, ClipboardList } from 'lucide-react';

const HomePage: React.FC = () => {
  const { leagues } = useLeague();
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative bg-secondary-600 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-900 to-transparent opacity-70"></div>
        <div className="relative z-10 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bienvenido a Liga Participando
          </h1>
          <p className="text-white/85 text-lg max-w-2xl mb-6">
            La plataforma oficial para seguir todas las competiciones,
            resultados y estadísticas de nuestras ligas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/league/liga_masculina" 
              className="btn bg-primary-600 hover:bg-primary-700 text-white"
            >
              Liga Participando
            </Link>
            <Link 
              to="/league/lifufe" 
              className="btn bg-accent-600 hover:bg-accent-700 text-white"
            >
              LIFUFE
            </Link>
            <Link 
              to="/league/mundialito" 
              className="btn bg-white hover:bg-gray-100 text-secondary-800"
            >
              Mundialito
            </Link>
          </div>
        </div>
      </section>

      {/* League Panels */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Nuestras Ligas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Link 
              key={league.id} 
              to={`/league/${league.id}`}
              className="league-panel group"
            >
              <div className="flex justify-center mb-4">
                {league.id === 'liga_masculina' && (
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <Trophy size={40} className="text-primary-600" />
                  </div>
                )}
                {league.id === 'lifufe' && (
                  <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center">
                    <Users size={40} className="text-accent-600" />
                  </div>
                )}
                {league.id === 'mundialito' && (
                  <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
                    <ClipboardList size={40} className="text-secondary-600" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-center mb-2 group-hover:text-primary-600 transition-colors">
                {league.name}
              </h3>
              
              <p className="text-gray-600 text-center mb-4">
                {league.description}
              </p>
              
              <div className="text-center">
                <span className="inline-block px-4 py-2 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors">
                  Ver detalles →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="mt-12 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Lo que ofrecemos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <ClipboardList size={28} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fixtures</h3>
            <p className="text-gray-600">
              Programa completo de todos los partidos organizados por fecha.
            </p>
          </div>
          
          <div className="p-4 text-center">
            <div className="mx-auto w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-4">
              <Trophy size={28} className="text-accent-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Resultados</h3>
            <p className="text-gray-600">
              Resultados actualizados de todos los partidos disputados.
            </p>
          </div>
          
          <div className="p-4 text-center">
            <div className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
              <Users size={28} className="text-secondary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Equipos</h3>
            <p className="text-gray-600">
              Información detallada de los equipos participantes en cada liga.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;