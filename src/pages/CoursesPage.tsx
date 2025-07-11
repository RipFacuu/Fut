import React from 'react';
import { useLeague } from '../contexts/LeagueContext';
import { Link } from 'react-router-dom';

const CoursesPage: React.FC = () => {
  const { getCourses } = useLeague();
  const courses = getCourses();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    // Usar una imagen de placeholder online
    target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Sin+Imagen';
    target.onerror = null; // Prevenir bucle infinito
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Cursos y Capacitaciones</h1>
      
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No hay cursos disponibles en este momento</p>
          <p className="text-gray-500">Por favor, vuelva a consultar más tarde</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <div className="relative w-full h-48 bg-gray-100">
                  <img
                    src={course.imageUrl || 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Sin+Imagen'}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                    onError={handleImageError}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 overflow-hidden line-clamp-3 max-h-[4.5rem]">{course.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {new Date(course.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {course.active && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Activo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;