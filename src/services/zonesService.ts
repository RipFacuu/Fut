import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type ZonaRow = Database['public']['Tables']['zonas']['Row']
type ZonaInsert = Database['public']['Tables']['zonas']['Insert']
type ZonaUpdate = Database['public']['Tables']['zonas']['Update']

export interface Zone {
  id: string
  name: string
  leagueId: string
  categoryId: string
}

// Convertir de formato de base de datos a formato de aplicación
const mapZonaToZone = (zona: ZonaRow): Zone => ({
  id: zona.id,
  name: zona.nombre,
  leagueId: zona.liga_id,
  categoryId: zona.categoria_id
})

// Convertir de formato de aplicación a formato de base de datos
const mapZoneToZona = (zone: Omit<Zone, 'id'>): ZonaInsert => ({
  nombre: zone.name,
  liga_id: zone.leagueId,
  categoria_id: zone.categoryId
})

export const zonesService = {
  // Obtener todas las zonas
  // AGREGAR este método si no existe
  // En getAllZones(), cambiar esta parte:
  async getAllZones(): Promise<Zone[]> {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('*');
      
      if (error) throw error;
      
      // Usar el mapper consistente en lugar de mapeo manual
      return data.map(mapZonaToZone);
    } catch (error) {
      console.error('Error fetching all zones:', error);
      throw error;
    }
  },

  // Obtener zonas por categoría
  async getZonesByCategory(categoryId: string): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zonas')
      .select('*')
      .eq('categoria_id', categoryId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching zones by category:', error);
      throw new Error('Error al obtener las zonas de la categoría');
    }

    return data?.map(mapZonaToZone) || []; // Agregar punto y coma aquí
  },

  // Crear nueva zona
  async createZone(zoneData: { name: string; leagueId: string; categoryId: string }): Promise<Zone> {
    const zonaData = mapZoneToZona(zoneData)
    
    const { data, error } = await supabase
      .from('zonas')
      .insert([zonaData])
      .select()
      .single()

    if (error) {
      console.error('Error creating zone:', error)
      throw new Error('Error al crear la zona')
    }

    return mapZonaToZone(data)
  },

  // Actualizar zona
  async updateZone(id: string, zoneData: { name: string; leagueId: string; categoryId: string }): Promise<Zone> {
    const zonaUpdate: ZonaUpdate = {
      nombre: zoneData.name,
      liga_id: zoneData.leagueId,
      categoria_id: zoneData.categoryId
    }

    const { data, error } = await supabase
      .from('zonas')
      .update(zonaUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating zone:', error)
      throw new Error('Error al actualizar la zona')
    }

    return mapZonaToZone(data)
  },

  // Eliminar zona
  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('zonas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting zone:', error)
      throw new Error('Error al eliminar la zona')
    }
  }
}