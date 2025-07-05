import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Heart, User, Facebook, Instagram } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
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
  
  return (
    <footer className="relative bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 text-white overflow-hidden">
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header del footer */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-50"></div>
              <Trophy size={24} className="relative text-white drop-shadow-sm" />
            </div>
            <span className="font-display text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              {getLeagueTitle()}
            </span>
          </div>
          <p className="text-white/60 text-sm">Fútbol Profesional</p>
        </div>
        
        {/* Contenido principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Ligas */}
          <div className="text-center sm:text-left">
            <h3 className="text-xs font-semibold mb-2 tracking-wide uppercase text-primary-100">Ligas</h3>
            <ul className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
              <li>
                <Link to="/league/liga_masculina" className="hover:text-white transition-colors duration-200 text-white/80">Liga Participando</Link>
              </li>
              <li>
                <Link to="/league/lifufe" className="hover:text-white transition-colors duration-200 text-white/80">LIFUFE</Link>
              </li>
              <li>
                <Link to="/league/mundialito" className="hover:text-white transition-colors duration-200 text-white/80">Mundialito</Link>
              </li>
            </ul>
          </div>
          
          {/* Contacto y redes */}
          <div className="text-center sm:text-right">
            <h3 className="text-xs font-semibold mb-2 tracking-wide uppercase text-primary-100">Contacto</h3>
            <div className="space-y-1">
              <p className="text-primary-100 text-sm font-medium">(+54) 3514594519</p>
              <div className="flex justify-center sm:justify-end space-x-3 mt-2">
                <a 
                  href="https://www.facebook.com/liga.participando" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200 hover:scale-110 text-white/70" 
                  title="Facebook Liga Participando"
                >
                  <Facebook size={18} />
                </a>
                <a 
                  href="https://www.instagram.com/liga_participando/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200 hover:scale-110 text-white/70" 
                  title="Instagram Liga Participando"
                >
                  <Instagram size={18} />
                </a>
                <a 
                  href="https://www.instagram.com/li.fu.fe_ligafem?igsh=MXUzeDhoMjRkb2xwYQ==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200 hover:scale-110 text-white/70" 
                  title="Instagram LIFUFE"
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-white/10 mt-4 pt-4 text-center">
          <p className="text-white/60 text-xs mb-1">
            &copy; {currentYear} Liga Participando. Todos los derechos reservados.
          </p>
          <p className="text-white/50 text-xs">
            Hecho con <span role="img" aria-label="laptop">💻</span> por{' '}
            <a
              href="https://github.com/RipFacuu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline hover:text-accent-300 font-medium transition-colors duration-200"
            >
              Facundo Aguirre
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;