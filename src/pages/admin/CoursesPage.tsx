import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { SupabaseService, mapSupabaseToCourse } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

// Definir el tipo Course
interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  active: boolean;
}

interface CourseFormData {
  title: string;
  description: string;
  imageFile: FileList;
  date: string;
  active: boolean;
}

// Tipo para los datos del curso sin archivo
interface CourseData {
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  active: boolean;
}

const AdminCoursesPage: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CourseFormData>();

  // Guardar temporalmente el archivo para el submit
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Cargar cursos al montar y tras cada cambio
  const loadCourses = async () => {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) {
      setCourses([]);
      return;
    }
    setCourses(data.map(mapSupabaseToCourse));
  };
  useEffect(() => { loadCourses(); }, []);

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      title: '',
      description: '',
      date: '',
      active: true
    });
  };

  const handleEditClick = (course: Course) => {
    setIsAdding(false);
    setEditingId(course.id);
    setValue('title', course.title);
    setValue('description', course.description);
    setValue('date', course.date);
    setValue('active', course.active);
  };

  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsUploading(true);
      let imageUrl = '';
      if (selectedImageFile) {
        imageUrl = await SupabaseService.uploadCourseImage(selectedImageFile);
      }
      if (isAdding) {
        await SupabaseService.createCourseWithImageUrl({
          title: data.title,
          description: data.description,
          imageUrl,
          date: data.date,
        });
      } else if (editingId) {
        await SupabaseService.updateCourseWithImageUrl(editingId, {
          title: data.title,
          description: data.description,
          imageUrl: imageUrl || undefined,
          date: data.date,
        });
      }
      await loadCourses();
      setIsAdding(false);
      setEditingId(null);
      setSelectedImageFile(null);
      reset();
    } catch (error) {
      alert('Error al guardar el curso. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este curso?')) {
      try {
        await SupabaseService.deleteCourse(id);
        await loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error al eliminar el curso. Por favor, intenta de nuevo.');
      }
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
                <label className="form-label" htmlFor="imageFile">
                  Imagen
                </label>
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  {...register('imageFile', { required: isAdding ? 'La imagen es requerida' : false })}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {isUploading && (
                  <p className="text-blue-500 text-sm mt-1">Subiendo imagen...</p>
                )}
                {errors.imageFile && (
                  <p className="text-red-500 text-sm mt-1">{errors.imageFile.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">
                  <input
                    type="checkbox"
                    className="mr-2"
                    {...register('active')}
                  />
                  Curso activo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline flex items-center space-x-2"
                onClick={handleCancelClick}
                disabled={isUploading}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
                disabled={isUploading}
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
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-lg text-gray-400">
                Sin imagen
              </div>
            )}
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
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{course.date}</p>
                {course.active && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Activo
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay cursos registrados</p>
          <p className="text-gray-400">Haz clic en "Agregar Curso" para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPage;