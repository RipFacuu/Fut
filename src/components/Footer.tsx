import React from 'react';
import { Trophy, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  
  return (
    <footer className="bg-primary-600 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Trophy size={24} className="text-accent-300" />
              <span className="font-heading text-xl font-semibold">Liga Participando</span>
            </div>
            <p className="text-primary-100 text-sm">
              Organizando y promoviendo el deporte desde 2010, Liga Participando
              es el hogar de múltiples competiciones deportivas.
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ligas</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/league/liga_masculina" className="text-primary-100 hover:text-white transition-colors">
                  Liga Masculina
                </Link>
              </li>
              <li>
                <Link to="/league/lifufe" className="text-primary-100 hover:text-white transition-colors">
                  LIFUFE
                </Link>
              </li>
              <li>
                <Link to="/league/mundialito" className="text-primary-100 hover:text-white transition-colors">
                  Mundialito
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact and Admin */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contacto</h3>
            <ul className="space-y-2 text-primary-100">
              <li>info@ligaparticipando.com</li>
              <li>Tel: (123) 456-7890</li>
              <li>Dirección: Av. Deportiva 123, Ciudad</li>
            </ul>
            
            {!isAuthenticated && (
              <Link
                to="/admin/login"
                className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-accent-500 hover:bg-accent-600 rounded-md text-white text-sm font-medium transition-colors"
              >
                <User size={16} />
                <span>Acceder como administrador</span>
              </Link>
            )}
          </div>
        </div>
        
        <div className="border-t border-primary-500 mt-8 pt-4 text-center text-primary-100 text-sm">
          <p>&copy; {currentYear} Liga Participando. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;