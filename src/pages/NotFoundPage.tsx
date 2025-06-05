import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={40} className="text-red-500" />
      </div>
      
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-medium mb-4">Página no encontrada</h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;