export interface Database {
  public: {
    Tables: {
      equipos: {
        Row: {
          id: string
          nombre: string
          zona_id: string
          liga_id: string
          categoria_id: string
          logo?: string        // ← Agregar esta línea
          created_at?: string
        }
        Insert: {
          id?: string
          nombre: string
          zona_id: string
          liga_id: string
          categoria_id: string
          logo?: string        // ← Agregar esta línea
        }
        Update: {
          id?: string
          nombre?: string
          zona_id?: string
          liga_id?: string
          categoria_id?: string
          logo?: string        // ← Agregar esta línea
        }
      }
      zonas: {
        Row: {
          id: string        // ← Asegúrate de que sea string
          nombre: string
          liga_id: string   // ← Asegúrate de que sea string
          categoria_id: string // ← Asegúrate de que sea string
          legend?: string   // ← Nuevo campo para leyenda editable
        }
        Insert: {
          id?: string
          nombre: string
          liga_id: string
          categoria_id?: string  // ← Hacer opcional
          legend?: string   // ← Nuevo campo para leyenda editable
        }
        Update: {
          id?: string
          nombre?: string
          liga_id?: string
          categoria_id?: string
          legend?: string   // ← Nuevo campo para leyenda editable
        }
      }
      ligas: {
        Row: {
          id: string
          nombre: string
          created_at?: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nombre: string
          liga_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          nombre: string
          liga_id: string
        }
        Update: {
          id?: string
          nombre?: string
          liga_id?: string
        }
      }
      fixtures: {
        Row: {
          id: string
          nombre: string
          fecha_partido: string
          liga_id: string
          categoria_id: string
          zona_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          nombre: string
          fecha_partido: string
          liga_id: string
          categoria_id: string
          zona_id: string
        }
        Update: {
          id?: string
          nombre?: string
          fecha_partido?: string
          liga_id?: string
          categoria_id?: string
          zona_id?: string
        }
      }
      partidos: {
        Row: {
          id: string
          equipo_local_id: string
          equipo_visitante_id: string
          zona_id: string
          fecha: string
          fixture_id?: string
          resultado_local?: number
          resultado_visitante?: number
          created_at?: string
        }
        Insert: {
          id?: string
          equipo_local_id: string
          equipo_visitante_id: string
          zona_id: string
          fecha: string
          fixture_id?: string
          resultado_local?: number
          resultado_visitante?: number
        }
        Update: {
          id?: string
          equipo_local_id?: string
          equipo_visitante_id?: string
          zona_id?: string
          fecha?: string
          fixture_id?: string
          resultado_local?: number
          resultado_visitante?: number
        }
      }
      standings: {
        Row: {
          id: string
          equipo_id: string
          zona_id: string
          liga_id: string
          categoria_id: string
          points: number
          played: number
          won: number
          drawn: number
          lost: number
          goals_for: number
          goals_against: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          equipo_id: string
          zona_id: string
          liga_id: string
          categoria_id: string
          points?: number
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
        }
        Update: {
          id?: string
          equipo_id?: string
          zona_id?: string
          liga_id?: string
          categoria_id?: string
          points?: number
          played?: number
          won?: number
          drawn?: number
          lost?: number
          goals_for?: number
          goals_against?: number
        }
      }
      flyers: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          link_url: string | null
          is_active: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          link_url?: string | null
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          link_url?: string | null
          is_active?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      created_at?: string
      updated_at?: string
    }
  }
}

export interface PosicionesEditable {
  equipo_id: number;
  zona_id: number;
  equipo_nombre: string;
  puntos: number | null;
  pj: number | null; // partidos jugados
}

export interface StandingsLegend {
  id: number;
  zona_id: string;
  categoria_id: string;
  leyenda: string;
}