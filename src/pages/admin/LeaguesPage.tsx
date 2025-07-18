import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { leaguesService, League } from '../../services/leaguesService';

const LeaguesPage: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<League>>({ name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeagues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaguesService.getAllLeagues();
      setLeagues(data);
    } catch (e) {
      setError('Error al cargar las ligas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm({ name: '' });
  };

  const handleEditClick = (league: League) => {
    setIsAdding(false);
    setEditingId(league.id);
    setForm({ ...league });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await leaguesService.updateLeague(editingId, form as League);
      } else {
        await leaguesService.createLeague(form as Omit<League, 'id'>);
      }
      await loadLeagues();
      handleCancel();
    } catch (e) {
      setError('Error al guardar la liga');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await leaguesService.deleteLeague(id);
      await loadLeagues();
    } catch (e) {
      setError('Error al eliminar la liga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Ligas</h1>
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
        >
          <Plus size={18} />
          <span>Agregar Liga</span>
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {(isAdding || editingId) && (
        <div className="bg-white p-4 rounded-md border space-y-4 max-w-lg">
          <div>
            <label className="form-label">Nombre</label>
            <input
              className="form-input w-full"
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              <Save size={16} /> Guardar
            </button>
            <button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-md shadow-sm p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leagues.map(league => (
                <tr key={league.id}>
                  <td className="px-4 py-2">{league.name}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(league)} disabled={loading}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(league.id)} disabled={loading}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {leagues.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-gray-500">No hay ligas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaguesPage; 