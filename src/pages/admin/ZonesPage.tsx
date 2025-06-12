import React, { useEffect, useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { zonesService, Zone } from '../../services/zonesService';

interface ZoneFormData {
  name: string;
  leagueId: string;
  categoryId: string;
}

const ZonesPage: React.FC = () => {
  // Agregar después de las importaciones del contexto:
  const {
    leagues,
    getCategoriesByLeague,
    getZonesByLeague, // ← Agregar esta función
  } = useLeague();

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ZoneFormData>({
    defaultValues: {
      leagueId: '',
      categoryId: '',
      name: '',
    },
  });

  const watchLeagueId = watch('leagueId');
  const watchCategoryId = watch('categoryId');

  // Modificar el useEffect para cargar zonas:
  useEffect(() => {
    if (selectedLeague === 'liga_masculina') {
      // Para liga masculina, cargar zonas por liga
      loadZonesByLeague(selectedLeague);
    } else if (selectedCategory) {
      // Para otras ligas, cargar zonas por categoría
      loadZonesByCategory(selectedCategory);
    } else {
      setZones([]);
    }
  }, [selectedCategory, selectedLeague]);

  useEffect(() => {
    if (!isAdding && !editingId) {
      setValue('leagueId', selectedLeague);
      setValue('categoryId', selectedCategory);
    }
  }, [selectedLeague, selectedCategory, setValue, isAdding, editingId]);

  const loadZonesByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const zonesData = await zonesService.getZonesByCategory(categoryId);
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading zones:', error);
      alert('Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva función:
  const loadZonesByLeague = async (leagueId: string) => {
    try {
      setLoading(true);
      const zonesData = getZonesByLeague(leagueId);
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading zones:', error);
      alert('Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      name: '',
    });
  };

  const handleEditClick = (zone: Zone) => {
    setIsAdding(false);
    setEditingId(zone.id);
    reset({
      name: zone.name,
      leagueId: zone.leagueId,
      categoryId: zone.categoryId,
    });
  };

  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: ZoneFormData) => {
    try {
      setLoading(true);
      
      if (isAdding) {
        // Para liga masculina, no requerir categoryId
        const zoneData = data.leagueId === 'liga_masculina' 
          ? { name: data.name, leagueId: data.leagueId }
          : { name: data.name, leagueId: data.leagueId, categoryId: data.categoryId };
          
        const newZone = await zonesService.createZone(zoneData);
        setZones(prev => [newZone, ...prev]);
      } else if (editingId) {
        const zoneData = data.leagueId === 'liga_masculina'
          ? { name: data.name, leagueId: data.leagueId }
          : { name: data.name, leagueId: data.leagueId, categoryId: data.categoryId };
          
        const updatedZone = await zonesService.updateZone(editingId, zoneData);
        setZones(prev => prev.map(zone =>
          zone.id === editingId ? updatedZone : zone
        ));
      }

      setIsAdding(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Error saving zone:', error);
      alert('Error al guardar la zona');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (
      window.confirm(
        '¿Estás seguro de eliminar esta zona? Esta acción eliminará todos los equipos y fixtures asociados.'
      )
    ) {
      try {
        setLoading(true);
        await zonesService.deleteZone(id);
        setZones(prev => prev.filter(zone => zone.id !== id));
      } catch (error) {
        console.error('Error deleting zone:', error);
        alert('Error al eliminar la zona');
      } finally {
        setLoading(false);
      }
    }
  };

  const categories = getCategoriesByLeague(watchLeagueId || selectedLeague);
  const filteredZones = watchCategoryId ? 
    zones.filter(zone => zone.categoryId === watchCategoryId) : 
    zones;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Zonas</h1>
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={loading || (!selectedCategory && selectedLeague !== 'liga_masculina')}
        >
          <Plus size={18} />
          <span>Agregar Zona</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="leagueFilter">
              Filtrar por Liga
            </label>
            <select
              id="leagueFilter"
              className="form-input"
              value={selectedLeague}
              onChange={(e) => {
                const leagueId = e.target.value;
                setSelectedLeague(leagueId);
                setSelectedCategory('');
              }}
              disabled={isAdding || !!editingId || loading}
            >
              <option value="">Seleccionar Liga</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ocultar selector de categoría para liga masculina */}
          {selectedLeague !== 'liga_masculina' && (
            <div>
              <label className="form-label" htmlFor="categoryFilter">
                Filtrar por Categoría
              </label>
              <select
                id="categoryFilter"
                className="form-input"
                value={selectedCategory}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  setSelectedCategory(categoryId);
                }}
                disabled={isAdding || !!editingId || !selectedLeague || loading}
              >
                <option value="">Seleccionar Categoría</option>
                {getCategoriesByLeague(selectedLeague).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="name">
                  Nombre de la Zona
                </label>
                <input
                  id="name"
                  className={cn('form-input', errors.name && 'border-red-500')}
                  {...register('name', { required: 'El nombre es requerido' })}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label" htmlFor="leagueId">
                  Liga
                </label>
                <select
                  id="leagueId"
                  className={cn('form-input', errors.leagueId && 'border-red-500')}
                  {...register('leagueId', { required: 'La liga es requerida' })}
                  onChange={(e) => setValue('leagueId', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Seleccionar Liga</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
                {errors.leagueId && (
                  <p className="text-sm text-red-500">{errors.leagueId.message}</p>
                )}
              </div>

              {/* En el formulario, ocultar el campo de categoría para liga masculina */}
              {watchLeagueId !== 'liga_masculina' && (
                <div>
                  <label className="form-label" htmlFor="categoryId">
                    Categoría
                  </label>
                  <select
                    id="categoryId"
                    className={cn('form-input', errors.categoryId && 'border-red-500')}
                    {...register('categoryId', { 
                      required: watchLeagueId !== 'liga_masculina' ? 'La categoría es requerida' : false 
                    })}
                    onChange={(e) => setValue('categoryId', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Seleccionar Categoría</option>
                    {getCategoriesByLeague(watchLeagueId).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline flex items-center space-x-2"
                onClick={handleCancelClick}
                disabled={loading}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>{isAdding ? 'Crear Zona' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !isAdding && !editingId && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-gray-500" />
        </div>
      )}

      {!loading && selectedCategory ? (
        filteredZones.length > 0 ? (
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
                {filteredZones.map((zone) => (
                  <tr key={zone.id}>
                    <td className="px-6 py-4">{zone.name}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleEditClick(zone)}
                        disabled={isAdding || !!editingId || loading}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteZone(zone.id)}
                        disabled={isAdding || !!editingId || loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-12 text-gray-500">
            No hay zonas. Agregá una para comenzar.
          </p>
        )
      ) : !loading && (
        <p className="text-center py-12 text-gray-500">
          Seleccioná una liga y categoría para ver las zonas.
        </p>
      )}
    </div>
  );
};

export default ZonesPage;
