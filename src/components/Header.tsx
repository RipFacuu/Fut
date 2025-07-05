import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para obtener el título de la liga según la ruta
  const getLeagueTitle = () => {
    if (location.pathname.startsWith('/league/lifufe')) {
      return 'LIFUFE';
    } else if (location.pathname.startsWith('/league/mundialito')) {
      return 'Mundialito';
    } else if (location.pathname.startsWith('/league/liga_masculina')) {
      return 'Liga Participando';
    }
    return 'Liga Participando'; // Default
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="relative bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 text-white shadow-xl border-b border-white/20">
      {/* Efecto de brillo en el header */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo con efectos */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Trophy size={32} className="relative text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                {getLeagueTitle()}
              </span>
              <div className="flex items-center space-x-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Fútbol Profesional</span>
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
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
            <NavLink 
              to="/league/liga_masculina" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                  : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">Liga Participando</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                </>
              )}
            </NavLink>
            <NavLink 
              to="/league/lifufe" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                  : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">LIFUFE</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                </>
              )}
            </NavLink>
            <NavLink 
              to="/league/mundialito" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                  : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-10">Mundialito</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                </>
              )}
            </NavLink>
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
            className="lg:hidden flex items-center p-2 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
            onClick={toggleMenu}
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
            <NavLink
              to="/league/liga_masculina"
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              Liga Participando
            </NavLink>
            <NavLink
              to="/league/lifufe"
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              LIFUFE
            </NavLink>
            <NavLink
              to="/league/mundialito"
              className={({ isActive }) => cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive ? "bg-white/20 text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              Mundialito
            </NavLink>
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