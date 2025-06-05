import React, { useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';

interface CourseFormData {
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  active: boolean;
}

const AdminCoursesPage: React.FC = () => {
  const { getCourses, addCourse, updateCourse, deleteCourse } = useLeague();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const courses = getCourses();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<CourseFormData>();

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset();
  };

  const handleEditClick = (course: Course) => {
    setIsAdding(false);
    setEditingId(course.id);
    Object.keys(course).forEach(key => {
      setValue(key as keyof CourseFormData, course[key as keyof Course]);
    });
  };

  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: CourseFormData) => {
    if (isAdding) {
      addCourse(data);
    } else if (editingId) {
      updateCourse(editingId, data);
    }
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este curso?')) {
      deleteCourse(id);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setValue('imageUrl', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Mostrar mensaje de error al usuario
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cursos y Capacitaciones</h1>
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={isAdding || !!editingId}
        >
          <Plus size={18} />
          <span>Agregar Curso</span>
        </button>
      </div>

      {/* Form */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 border">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="title">
                  Título
                </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  autoComplete="off"
                  {...register('title', { required: 'El título es requerido' })}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="date">
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  autoComplete="off"
                  {...register('date', { required: 'La fecha es requerida' })}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label" htmlFor="description">
                  Descripción
                </label>
                <textarea
                  id="description"
                  className="form-input"
                  rows={3}
                  {...register('description', { required: 'La descripción es requerida' })}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label" htmlFor="imageUrl">
                  Imagen
                </label>
                <input
                  id="imageUrl"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                />
                {errors.imageUrl && (
                  <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline flex items-center space-x-2"
                onClick={handleCancelClick}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{isAdding ? 'Crear Curso' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{course.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(course)}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={isAdding || !!editingId}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isAdding || !!editingId}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{course.description}</p>
              <p className="text-sm text-gray-500">{course.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoursesPage;