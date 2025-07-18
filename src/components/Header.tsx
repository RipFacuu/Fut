import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { useLeague } from '../contexts/LeagueContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { leagues } = useLeague();

  // Ordenar: primero las conocidas, luego el resto por id ascendente
  const knownOrder = ['liga_masculina', 'lifufe', 'mundialito'];
  const orderedLeagues = [
    ...knownOrder.map(id => leagues.find(l => l.id === id)).filter(Boolean),
    ...leagues.filter(l => !knownOrder.includes(l.id)).sort((a, b) => Number(a.id) - Number(b.id))
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper para mostrar nombre especial si es liga conocida
  const getLeagueDisplayName = (league: { id: string; name: string }) => {
    switch (league.id) {
      case 'liga_masculina':
        return 'Liga Participando';
      case 'lifufe':
        return 'LIFUFE';
      case 'mundialito':
        return 'Mundialito';
      default:
        return league.name;
    }
  };

  return (
    <header className="relative bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 text-white shadow-xl border-b border-white/20">
      {/* Efecto de brillo en el header */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative flex items-center justify-center w-full h-20 lg:justify-between lg:items-center">
          {/* Logos y texto personalizado */}
          <Link to="/" className="flex items-center justify-center w-full space-x-4 group mx-auto lg:mx-0 lg:w-auto lg:mb-0 lg:justify-start">
            <img src="/liga_participando.jpeg" alt="Liga Participando" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow cursor-pointer" />
            <img src="/lifufe.jpeg" alt="LIFUFE" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow cursor-pointer" />
            <img src="/mundialito.jpeg" alt="Mundialito" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow cursor-pointer" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <NavLink 
              to="/" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                  : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
              )}
              end
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">Inicio</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                </>
              )}
            </NavLink>
            {/* Mostrar todas las ligas dinámicamente */}
            {orderedLeagues.map((league) => (
              <NavLink
                key={league.id}
                to={`/league/${league.id}`}
                className={({ isActive }) => cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                  isActive 
                    ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                    : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{getLeagueDisplayName(league)}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
            <NavLink 
              to="/courses" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                  : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">Cursos</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                </>
              )}
            </NavLink>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 text-white transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg"
                >
                  <User size={18} />
                  <span>Panel Admin</span>
                </Link>
                <button
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white transition-all duration-300 hover:scale-105 shadow-lg ml-4"
              >
                <User size={18} />
                <span>Acceder</span>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="lg:hidden flex items-center p-2 text-white hover:bg-white/10 rounded-xl transition-all duration-300 absolute right-4 top-1/2 -translate-y-1/2"
            onClick={toggleMenu}
            style={{ zIndex: 20 }}
          >
            {isMenuOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <Menu size={24} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden py-4 bg-gradient-to-b from-primary-700 to-primary-800 border-t border-white/20 backdrop-blur-md">
          <div className="container mx-auto px-4 flex flex-col space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
              onClick={toggleMenu}
              end
            >
              Inicio
            </NavLink>
            {/* Mostrar todas las ligas dinámicamente en mobile */}
            {orderedLeagues.map((league) => (
              <NavLink
                key={league.id}
                to={`/league/${league.id}`}
                className={({ isActive }) => cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                  isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
                )}
                onClick={toggleMenu}
              >
                {getLeagueDisplayName(league)}
              </NavLink>
            ))}
            <NavLink
              to="/courses"
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              Cursos
            </NavLink>
            
            {isAuthenticated ? (
              <div className="flex flex-col space-y-2 pt-2 border-t border-white/20">
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 text-white transition-all duration-300"
                  onClick={toggleMenu}
                >
                  <User size={18} />
                  <span>Panel Admin</span>
                </Link>
                <button
                  className="flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300"
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white transition-all duration-300"
                onClick={toggleMenu}
              >
                <User size={18} />
                <span>Acceder</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;