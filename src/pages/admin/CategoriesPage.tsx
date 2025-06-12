import React, { useState } from 'react';
import { useLeague, Category } from '../../contexts/LeagueContext';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CategoryFormData {
  name: string;
  leagueId: string;
  zoneId?: string;
  isEditable: boolean;
}

const CategoriesPage: React.FC = () => {
  const { 
    leagues, 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    getZonesByLeague
  } = useLeague();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      leagueId: selectedLeague,
      name: '',
      zoneId: '',
      isEditable: true
    }
  });
  
  const watchLeagueId = watch('leagueId');
  
  // Filter categories by selected league
  const filteredCategories = categories.filter(category => category.leagueId === selectedLeague);
  
  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      leagueId: selectedLeague,
      name: '',
      zoneId: '',
      isEditable: true
    });
  };
  
  const handleEditClick = (category: Category) => {
    setIsAdding(false);
    setEditingId(category.id);
    reset({
      name: category.name,
      leagueId: category.leagueId,
      zoneId: (category as any).zoneId || '',
      isEditable: category.isEditable
    });
  };
  
  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };
  
  const onSubmit = async (data: CategoryFormData) => {
    try {
      // Validar que si es liga masculina, debe tener zona
      if (data.leagueId === 'liga_masculina' && !data.zoneId) {
        alert('Debe seleccionar una zona para la liga masculina');
        return;
      }
      
      if (isAdding) {
        const categoryData = {
          name: data.name,
          leagueId: data.leagueId,
          isEditable: data.isEditable,
          ...(data.zoneId && { zoneId: data.zoneId })
        };
        await addCategory(categoryData);
      } else if (editingId) {
        const updateData = {
          name: data.name,
          leagueId: data.leagueId,
          isEditable: data.isEditable,
          ...(data.zoneId && { zoneId: data.zoneId })
        };
        updateCategory(editingId, updateData);
      }
      
      setIsAdding(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
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
  
  // Función para manejar el cambio de liga en el formulario - CORREGIDA
  const handleFormLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setValue('leagueId', leagueId, { shouldValidate: true });
    setValue('zoneId', '', { shouldValidate: true });
  };
  
  // Debug: agregar console.log para verificar
  console.log('watchLeagueId:', watchLeagueId);
  console.log('zones for liga_masculina:', getZonesByLeague('liga_masculina'));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
        >
          <Plus size={18} />
          <span>Agregar Categoría</span>
        </button>
      </div>
      
      {/* League Filter */}
      <div className="bg-white p-4 rounded-md border">
        <div className="mb-4">
          <label className="form-label" htmlFor="leagueFilter">
            Filtrar por Liga
          </label>
          <select
            id="leagueFilter"
            className="form-input"
            value={selectedLeague}
            onChange={handleLeagueChange}
          >
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Form */}
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
                onChange={handleFormLeagueChange}
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
            
            {/* Selector de zona solo para liga masculina - excluir lifufe y mundialito */}
            {watchLeagueId === 'liga_masculina' && watchLeagueId !== 'lifufe' && watchLeagueId !== 'mundialito' && (
            <div className="mb-4">
            <label className="form-label" htmlFor="zoneId">
            Filtrar por Zona *
            </label>
            <select
            id="zoneId"
            className={cn(
            "form-input",
            errors.zoneId && "border-red-500"
            )}
            {...register('zoneId', { 
            required: watchLeagueId === 'liga_masculina' ? 'La zona es requerida para la liga masculina' : false 
            })}
            >
            <option value="">Seleccionar Zona</option>
            {getZonesByLeague(watchLeagueId).map(zone => (
            <option key={zone.id} value={zone.id}>
            {zone.name}
            </option>
            ))}
            </select>
            {errors.zoneId && (
            <p className="mt-1 text-sm text-red-600">{errors.zoneId.message}</p>
            )}
            </div>
            )}
            
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
                {selectedLeague === 'liga_masculina' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zona
                  </th>
                )}
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
                  {selectedLeague === 'liga_masculina' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(category as any).zoneName || 'Sin zona'}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {category.isEditable && (
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(category)}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-md p-8 text-center">
          <p className="text-gray-500">No hay categorías para mostrar en esta liga.</p>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;