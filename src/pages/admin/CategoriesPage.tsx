import React, { useState } from 'react';
  import { useLeague, Category } from '../../contexts/LeagueContext';
  import { useForm } from 'react-hook-form';
  import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
  import { cn } from '../../utils/cn';

  interface CategoryFormData {
    name: string;
    leagueId: string;
    isEditable: boolean;
  }

  const CategoriesPage: React.FC = () => {
    const { leagues, categories, addCategory, updateCategory, deleteCategory } = useLeague();
    
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
      defaultValues: {
        leagueId: selectedLeague,
        name: '',
        isEditable: true
      }
    });
    
    // Filter categories by selected league
    const filteredCategories = categories.filter(category => category.leagueId === selectedLeague);
    
    const handleAddClick = () => {
      setIsAdding(true);
      setEditingId(null);
      reset({
        leagueId: selectedLeague,
        name: '',
        isEditable: true
      });
    };
    
    const handleEditClick = (category: Category) => {
      setIsAdding(false);
      setEditingId(category.id);
      reset({
        name: category.name,
        leagueId: category.leagueId,
        isEditable: category.isEditable
      });
    };
    
    const handleCancelClick = () => {
      setIsAdding(false);
      setEditingId(null);
    };
    
    const onSubmit = async (data: CategoryFormData) => {
      try {
        if (isAdding) {
          await addCategory(data);
        } else if (editingId) {
          updateCategory(editingId, data);
        }
        
        setIsAdding(false);
        setEditingId(null);
        reset();
      } catch (error) {
        console.error('Error saving category:', error);
        // Aquí puedes agregar un mensaje de error para el usuario
      }
    };
    
    const handleDeleteCategory = async (id: string) => {
      if (window.confirm('¿Estás seguro de eliminar esta categoría? Esta acción eliminará todas las zonas, equipos y fixtures asociados.')) {
        await deleteCategory(id);
      }
    };
    
    const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const leagueId = e.target.value;
      setSelectedLeague(leagueId);
    
      const newCategories = categories.filter(c => c.leagueId === leagueId);
      if (newCategories.length > 0) {
        setSelectedCategory(newCategories[0].id);
      } else {
        setSelectedCategory('');
      }
    };
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Categorías</h1>
          
          <button
            className="btn btn-primary flex items-center space-x-2"
            onClick={handleAddClick}
            disabled={isAdding || !!editingId}
          >
            <Plus size={18} />
            <span>Agregar Categoría</span>
          </button>
        </div>
        
        {/* League selector */}
        <div className="mb-6">
          <label htmlFor="leagueFilter" className="form-label">
            Filtrar por Liga
          </label>
          <select
            id="leagueFilter"
            className="form-input"
            value={selectedLeague}
            onChange={handleLeagueChange}
            disabled={isAdding || !!editingId}
          >
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="bg-gray-50 p-4 rounded-md mb-6 border">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="form-label" htmlFor="name">
                  Nombre de la Categoría
                </label>
                <input
                  id="name"
                  type="text"
                  className={cn(
                    "form-input",
                    errors.name && "border-red-500"
                  )}
                  {...register('name', { required: 'El nombre es requerido' })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="form-label" htmlFor="leagueId">
                  Liga
                </label>
                <select
                  id="leagueId"
                  className={cn(
                    "form-input",
                    errors.leagueId && "border-red-500"
                  )}
                  {...register('leagueId', { required: 'La liga es requerida' })}
                >
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
                {errors.leagueId && (
                  <p className="mt-1 text-sm text-red-600">{errors.leagueId.message}</p>
                )}
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
                  <span>{isAdding ? 'Crear Categoría' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Categories List */}
        {filteredCategories.length > 0 ? (
          <div className="bg-white border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleEditClick(category)}
                          disabled={isAdding || !!editingId}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={isAdding || !!editingId}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p className="text-gray-500 mb-4">
              No hay categorías en esta liga. Haz clic en "Agregar Categoría" para crear una.
            </p>
          </div>
        )}
      </div>
    );
  };

  export default CategoriesPage;