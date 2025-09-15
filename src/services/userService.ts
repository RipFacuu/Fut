import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];
type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update'];

export interface UserRegistrationData {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  documento: string;
  escuela: string;
  equipo_id: string;
  email?: string;
  password?: string;
}

export interface UserLoginData {
  documento: string;
  password: string;
}

export interface Team {
  id: string;
  nombre: string;
  zona_id: string;
  liga_id: string;
  categoria_id: string;
}

export class UserService {
  // Crear nuevo usuario
  static async createUser(userData: UserRegistrationData): Promise<Usuario | null> {
    try {
      // Verificar si ya existe un usuario con ese documento
      const existingUser = await this.getUserByDocument(userData.documento);
      if (existingUser) {
        throw new Error('Ya existe un usuario con ese documento');
      }

      const { data, error } = await supabase
        .from('usuarios')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Error creando usuario:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  }

  // Obtener usuario por documento
  static async getUserByDocument(documento: string): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('documento', documento)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error obteniendo usuario por documento:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getUserByDocument:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  static async getUserById(id: string): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo usuario por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getUserById:', error);
      throw error;
    }
  }

  // Obtener todos los equipos
  static async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error obteniendo equipos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllTeams:', error);
      throw error;
    }
  }

  // Obtener equipos por liga
  static async getTeamsByLeague(leagueId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('liga_id', leagueId)
        .order('nombre');

      if (error) {
        console.error('Error obteniendo equipos por liga:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getTeamsByLeague:', error);
      throw error;
    }
  }

  // Obtener equipos por zona
  static async getTeamsByZone(zoneId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('zona_id', zoneId)
        .order('nombre');

      if (error) {
        console.error('Error obteniendo equipos por zona:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getTeamsByZone:', error);
      throw error;
    }
  }

  // Actualizar usuario
  static async updateUser(id: string, updates: UsuarioUpdate): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando usuario:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en updateUser:', error);
      throw error;
    }
  }

  // Eliminar usuario
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando usuario:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async getAllUsers(): Promise<Usuario[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('apellido')
        .order('nombre');

      if (error) {
        console.error('Error obteniendo usuarios:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      throw error;
    }
  }

  // Obtener usuarios por equipo
  static async getUsersByTeam(teamId: string): Promise<Usuario[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('equipo_id', teamId)
        .order('apellido')
        .order('nombre');

      if (error) {
        console.error('Error obteniendo usuarios por equipo:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getUsersByTeam:', error);
      throw error;
    }
  }

  // Validar documento (solo números)
  static validateDocument(documento: string): boolean {
    return /^\d+$/.test(documento);
  }

  // Validar fecha de nacimiento
  static validateBirthDate(fecha: string): boolean {
    const date = new Date(fecha);
    const today = new Date();
    const minDate = new Date('1990-01-01');
    const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()); // Mínimo 5 años
    
    return date >= minDate && date <= maxDate && !isNaN(date.getTime());
  }

  // Validar datos de registro
  static validateRegistrationData(data: UserRegistrationData): string[] {
    const errors: string[] = [];

    if (!data.nombre.trim()) errors.push('El nombre es obligatorio');
    if (!data.apellido.trim()) errors.push('El apellido es obligatorio');
    if (!data.documento.trim()) errors.push('El documento es obligatorio');
    if (!this.validateDocument(data.documento)) errors.push('El documento debe contener solo números');
    if (!data.escuela.trim()) errors.push('La escuela es obligatoria');
    if (!data.equipo_id) errors.push('Debe seleccionar un equipo');
    if (!this.validateBirthDate(data.fecha_nacimiento)) {
      errors.push('La fecha de nacimiento no es válida o el usuario es muy joven');
    }

    return errors;
  }
}
