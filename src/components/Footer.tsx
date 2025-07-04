import React from 'react';
import { Trophy, User, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  
  return (
    <footer className="w-full mt-12 px-4 py-3 bg-primary-600 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Ligas */}
          <div>
            <h3 className="text-sm font-semibold mb-1 tracking-wide uppercase text-primary-100">Ligas</h3>
            <ul className="flex flex-wrap gap-3">
              <li>
                <Link to="/league/liga_masculina" className="hover:text-white transition-colors font-medium">Liga Participando</Link>
              </li>
              <li>
                <Link to="/league/lifufe" className="hover:text-white transition-colors font-medium">LIFUFE</Link>
              </li>
              <li>
                <Link to="/league/mundialito" className="hover:text-white transition-colors font-medium">Mundialito</Link>
              </li>
            </ul>
          </div>
          {/* Contacto y redes */}
          <div className="flex flex-col items-start md:items-end space-y-1">
            <h3 className="text-sm font-semibold mb-1 tracking-wide uppercase text-primary-100">Contacto</h3>
            <span className="text-primary-100 font-medium">Tel: (+54) 3514594519</span>
            <div className="flex space-x-3 mt-1">
              <a href="https://www.facebook.com/liga.participando" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center" title="Facebook Liga Participando">
                <Facebook size={22} />
              </a>
              <a href="https://www.instagram.com/liga_participando/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform flex items-center" title="Instagram Liga Participando">
                <Instagram size={22} />
                <span className="ml-1 text-xs">Liga</span>
              </a>
              <a href="https://www.instagram.com/li.fu.fe_ligafem?igsh=MXUzeDhoMjRkb2xwYQ==" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform flex items-center" title="Instagram LIFUFE">
                <Instagram size={22} />
                <span className="ml-1 text-xs">LIFUFE</span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-500 mt-4 pt-2 text-center text-primary-100 text-xs">
          <p>&copy; {currentYear} Liga Participando. Todos los derechos reservados.</p>
          <p className="mt-2 text-xs text-primary-200">
            Hecho con <span role="img" aria-label="laptop">💻</span> por{' '}
            <a
              href="https://github.com/RipFacuu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-accent-300 font-medium transition-colors"
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