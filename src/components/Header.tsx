import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <header className="bg-primary-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Trophy size={28} className="text-accent-300" />
            <span className="font-heading text-xl font-semibold">Liga Participando</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
              end
            >
              Inicio
            </NavLink>
            <NavLink 
              to="/league/liga_masculina" 
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
            >
              Liga Masculina
            </NavLink>
            <NavLink 
              to="/league/lifufe" 
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
            >
              LIFUFE
            </NavLink>
            <NavLink 
              to="/league/mundialito" 
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
            >
              Mundialito
            </NavLink>
            <NavLink 
              to="/courses" 
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
            >
              Cursos y Capacitaciones
            </NavLink>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary-700 hover:bg-primary-800 text-white transition-colors"
                >
                  <User size={18} />
                  <span>Panel Admin</span>
                </Link>
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white transition-colors"
              >
                <User size={18} />
                <span>Acceder como administrador</span>
              </Link>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center p-2 text-primary-100 hover:text-white"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-2 bg-primary-700">
          <div className="container mx-auto px-4 flex flex-col space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium",
                isActive ? "bg-primary-800 text-white" : "text-primary-100 hover:bg-primary-800 hover:text-white"
              )}
              onClick={toggleMenu}
              end
            >
              Inicio
            </NavLink>
            <NavLink
              to="/league/liga_masculina"
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium",
                isActive ? "bg-primary-800 text-white" : "text-primary-100 hover:bg-primary-800 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              Liga Masculina
            </NavLink>
            <NavLink
              to="/league/lifufe"
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium",
                isActive ? "bg-primary-800 text-white" : "text-primary-100 hover:bg-primary-800 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              LIFUFE
            </NavLink>
            <NavLink
              to="/league/mundialito"
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium",
                isActive ? "bg-primary-800 text-white" : "text-primary-100 hover:bg-primary-800 hover:text-white"
              )}
              onClick={toggleMenu}
            >
              Mundialito
            </NavLink>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary-800 hover:bg-primary-900 text-white transition-colors text-left"
                  onClick={toggleMenu}
                >
                  <User size={18} />
                  <span>Panel Admin</span>
                </Link>
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white transition-colors text-left"
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white transition-colors"
                onClick={toggleMenu}
              >
                <User size={18} />
                <span>Acceder como administrador</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;