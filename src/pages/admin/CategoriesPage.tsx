import React, { useState, useMemo } from 'react';
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
  const [selectedZone, setSelectedZone] = useState<string>(''); // Nuevo estado para filtrar por zona
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      leagueId: selectedLeague,
      name: '',
      zoneId: '',
      isEditable: true
    }
  });
  
  const watchLeagueId = watch('leagueId');
  const isLigaParticipando = selectedLeague === 'liga_masculina';
  
  // Obtener zonas de la liga seleccionada
  const availableZones = useMemo(() => {
    if (isLigaParticipando) {
      return getZonesByLeague(selectedLeague);
    }
    return [];
  }, [selectedLeague, isLigaParticipando, getZonesByLeague]);
  
  // Filter categories by selected league and optionally by zone
  const filteredCategories = useMemo(() => {
    let filtered = categories.filter(category => category.leagueId === selectedLeague);
    
    // Si es Liga Participando y hay una zona seleccionada, filtrar por zona
    if (isLigaParticipando && selectedZone) {
      filtered = filtered.filter(category => (category as any).zoneId === selectedZone);
    }
    
    return filtered;
  }, [categories, selectedLeague, selectedZone, isLigaParticipando]);
  
  // Agrupar categorías por zona para Liga Participando
  const categoriesByZone = useMemo(() => {
    if (!isLigaParticipando) return {};
    
    const grouped: { [zoneId: string]: Category[] } = {};
    
    filteredCategories.forEach(category => {
      const zoneId = (category as any).zoneId || 'sin_zona';
      if (!grouped[zoneId]) {
        grouped[zoneId] = [];
      }
      grouped[zoneId].push(category);
    });
    
    return grouped;
  }, [filteredCategories, isLigaParticipando]);

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      leagueId: selectedLeague,
      name: '',
      zoneId: isLigaParticipando ? selectedZone : '',
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
      // Validar que si es liga participando, debe tener zona
      if (data.leagueId === 'liga_masculina' && !data.zoneId) {
        alert('Debe seleccionar una zona para la Liga Participando');
        return;
      }
      
      if (isAdding) {
        const categoryData = {
          name: data.name,
          leagueId: data.leagueId,
          isEditable: data.isEditable,
          ...(data.zoneId && { zoneId: String(Number(data.zoneId)) })
        };
        await addCategory(categoryData);
      } else if (editingId) {
        const updateData = {
          name: data.name,
          leagueId: data.leagueId,
          isEditable: data.isEditable,
          ...(data.zoneId && { zoneId: String(Number(data.zoneId)) })
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
    setSelectedZone(''); // Resetear zona al cambiar liga
  };
  
  // Función para manejar el cambio de liga en el formulario
  const handleFormLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setValue('leagueId', leagueId, { shouldValidate: true });
    setValue('zoneId', '', { shouldValidate: true });
  };
  
  const getZoneName = (zoneId: string | undefined | null) => {
    if (!zoneId) return 'Sin zona';
    const zone = availableZones.find(z => String(z.id) === String(zoneId));
    return zone ? zone.name : 'Sin zona';
  };
  
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
      
      {/* League and Zone Filters */}
      <div className="bg-white p-4 rounded-md border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          
          {/* Filtro por zona solo para Liga Participando */}
          {isLigaParticipando && (
            <div>
              <label className="form-label" htmlFor="zoneFilter">
                Filtrar por Zona
              </label>
              <select
                id="zoneFilter"
                className="form-input"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="">Todas las zonas</option>
                {availableZones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            
            {/* Selector de zona solo para Liga Participando */}
            {watchLeagueId === 'liga_masculina' && (
              <div className="mb-4">
                <label className="form-label" htmlFor="zoneId">
                  Zona *
                </label>
                <select
                  id="zoneId"
                  className={cn(
                    "form-input",
                    errors.zoneId && "border-red-500"
                  )}
                  {...register('zoneId', { 
                    required: 'La zona es requerida para la Liga Participando' 
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
          {isLigaParticipando && !selectedZone ? (
            // Vista agrupada por zonas para Liga Participando
            <div className="space-y-6 p-6">
              {Object.entries(categoriesByZone).map(([zoneId, zoneCategories]) => (
                <div key={zoneId} className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {getZoneName(zoneId)}
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        ({zoneCategories.length} categoría{zoneCategories.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
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
                        {zoneCategories.map(category => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {category.name}
                              </div>
                            </td>
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
                </div>
              ))}
            </div>
          ) : (
            // Vista de tabla tradicional
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  {isLigaParticipando && (
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
                    {isLigaParticipando && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getZoneName(category.zoneId ?? '')}
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
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-md p-8 text-center">
          <p className="text-gray-500">
            {isLigaParticipando && selectedZone 
              ? `No hay categorías para mostrar en la zona seleccionada.`
              : `No hay categorías para mostrar en esta liga.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;