import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLeague } from '../contexts/LeagueContext';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCourses } = useLeague();
  const course = getCourses().find(c => c.id === id);

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Curso no encontrado</h2>
        <Link to="/courses" className="text-primary-600 underline">Volver a cursos</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link to="/courses" className="text-primary-600 underline mb-4 inline-block">&larr; Volver a cursos</Link>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {course.imageUrl && (
          <div className="flex justify-center items-center bg-white" style={{ minHeight: 420 }}>
            <img
              src={course.imageUrl}
              alt={course.title}
              className="object-contain max-h-[520px] w-full rounded-lg shadow-lg border border-gray-100"
              style={{ maxHeight: 520, background: '#fff' }}
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <p className="text-sm text-gray-500 mb-2">
            Fecha: {new Date(course.date).toLocaleDateString('es-ES', {
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
  );
};

export default CourseDetailPage; 