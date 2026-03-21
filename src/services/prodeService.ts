import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type ProdePrediction = Database['public']['Tables']['prode_predictions']['Row'];
type ProdePredictionInsert = Database['public']['Tables']['prode_predictions']['Insert'];
type ProdeUserScore = Database['public']['Tables']['prode_user_scores']['Row'];
type ProdeConfig = Database['public']['Tables']['prode_config']['Row'];

export interface MatchWithPrediction {
  id: string;
  fecha: string;
  equipo_local: {
    id: string;
    nombre: string;
  };
  equipo_visitante: {
    id: string;
    nombre: string;
  };
  zona: {
    id: string;
    nombre: string;
  };
  resultado_local?: number;
  resultado_visitante?: number;
  user_prediction?: string;
  can_predict: boolean;
  prediction_deadline: string;
  fixture_info?: {
    nombre: string;
    fecha_partido: string;
    leyenda?: string;
    texto_central?: string;
  };
}

export interface UserProdeStats {
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  rank?: number;
}

export interface ProdeLeaderboardEntry {
  user_id: string;
  user_name: string;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  rank: number;
}

export type PredictionType = 'local' | 'empate' | 'visitante';

export class ProdeService {
  // Obtener configuración del Prode
  static async getConfig(): Promise<ProdeConfig | null> {
    try {
      // MODO OFFLINE: Usar solo configuración local
      console.log('🎯 MODO OFFLINE: Usando configuración local');
      return {
        id: 'local-config',
        points_per_correct_prediction: 3,
        points_per_incorrect_prediction: 0,
        prediction_deadline_minutes: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // NOTA: Para usar configuración real, descomenta el código de abajo
      /*
      // Primero intentar obtener de la base de datos
      const { data, error } = await supabase
        .from('prode_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('⚠️ Base de datos no disponible, usando configuración local');
        // Configuración local por defecto
        return {
          id: 'local-config',
          points_per_correct_prediction: 3,
          points_per_incorrect_prediction: 0,
          prediction_deadline_minutes: 15,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
      */
    } catch (error) {
      console.log('⚠️ Error en BD, usando configuración local');
      // Configuración local por defecto
      return {
        id: 'local-config',
        points_per_correct_prediction: 3,
        points_per_incorrect_prediction: 0,
        prediction_deadline_minutes: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  // Obtener partidos disponibles para el Prode
  static async getAvailableMatches(userId?: string, filters?: {
    zonaId?: string;
    fixtureId?: string;
    torneo?: string;
  }): Promise<MatchWithPrediction[]> {
    try {
      // Primero intentar obtener fixtures reales de la base de datos
      try {
        const { data: fixtures, error } = await supabase
          .from('fixtures')
          .select('*')
          .order('fecha_partido', { ascending: true });

        if (error) {
          console.log('⚠️ Error obteniendo fixtures, usando datos locales');
          return this.getLocalMatches(userId);
        }

        if (!fixtures || fixtures.length === 0) {
          console.log('⚠️ No hay fixtures en la BD, usando datos locales');
          return this.getLocalMatches(userId);
        }

        // Obtener partidos para cada fixture
        const allMatches: MatchWithPrediction[] = [];
        
        for (const fixture of fixtures) {
          const { data: partidos, error: partidosError } = await supabase
            .from('partidos')
            .select(`
              id,
              fecha,
              resultado_local,
              resultado_visitante,
              equipo_local_id,
              equipo_visitante_id,
              equipo_local: equipos!partidos_equipo_local_id_fkey (id, nombre),
              equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (id, nombre),
              zona: zonas!partidos_zona_id_fkey (id, nombre)
            `)
            .eq('fixture_id', fixture.id);

          if (partidosError) {
            console.log(`⚠️ Error obteniendo partidos para fixture ${fixture.id}, intentando consulta simple:`, partidosError);
            const { data: simplePartidos, error: simpleError } = await supabase
              .from('partidos')
              .select('*')
              .eq('fixture_id', fixture.id);
            
            if (simpleError) {
              console.log(`⚠️ Error en consulta simple para fixture ${fixture.id}:`, simpleError);
              continue;
            }
            
            // Procesar datos simples
            for (const partido of (simplePartidos || [])) {
              allMatches.push(await this.processMatchData(partido, fixture, userId));
            }
            continue;
          }

          if (partidos && partidos.length > 0) {
            // Procesar cada partido
            for (const partido of partidos) {
              allMatches.push(await this.processMatchData(partido, fixture, userId));
            }
          }
        }

        if (allMatches.length > 0) {
          console.log(`🎯 Usando ${allMatches.length} partidos reales de ${fixtures.length} fixtures`);
          
          // Aplicar filtros si están especificados
          if (filters) {
            return this.applyFilters(allMatches, filters);
          }
          
          return allMatches;
        }

        console.log('⚠️ No hay partidos en los fixtures, usando datos locales');
        return this.getLocalMatches(userId);

      } catch (error) {
        console.log('⚠️ Error accediendo a la BD, usando datos locales:', error);
        return this.getLocalMatches(userId);
      }

    } catch (error) {
      console.error('Error en getAvailableMatches:', error);
      return this.getLocalMatches(userId);
    }
  }

  // Helper para procesar datos de partido
  private static async processMatchData(partido: any, fixture: any, userId?: string): Promise<MatchWithPrediction> {
    const matchDate = new Date(partido.fecha);
    const now = new Date();
    const config = await this.getConfig();
    const deadlineMinutes = config?.prediction_deadline_minutes || 15;
    const deadline = new Date(matchDate.getTime() - deadlineMinutes * 60 * 1000);
    const canPredict = now < deadline;

    // Obtener predicción del usuario si existe
    let userPrediction: string | undefined;
    if (userId) {
      try {
        const { data: prediction } = await supabase
          .from('prode_predictions')
          .select('prediction')
          .eq('user_id', userId)
          .eq('partido_id', partido.id)
          .maybeSingle();
        
        if (prediction) {
          userPrediction = prediction.prediction;
        }
      } catch {
        // No hay predicción o error, continuar
      }
    }

    // Asegurarse de que equipo_local/visitante sean objetos y no arrays
    const equipoLocal = Array.isArray(partido.equipo_local) ? partido.equipo_local[0] : partido.equipo_local;
    const equipoVisitante = Array.isArray(partido.equipo_visitante) ? partido.equipo_visitante[0] : partido.equipo_visitante;
    const zona = Array.isArray(partido.zona) ? partido.zona[0] : partido.zona;

    return {
      id: partido.id,
      fecha: partido.fecha,
      resultado_local: partido.resultado_local,
      resultado_visitante: partido.resultado_visitante,
      equipo_local: equipoLocal || { id: partido.equipo_local_id, nombre: `Equipo ${partido.equipo_local_id}` },
      equipo_visitante: equipoVisitante || { id: partido.equipo_visitante_id, nombre: `Equipo ${partido.equipo_visitante_id}` },
      zona: zona || { id: partido.zona_id, nombre: `Zona ${partido.zona_id}` },
      user_prediction: userPrediction,
      can_predict: canPredict,
      prediction_deadline: deadline.toISOString(),
      fixture_info: {
        nombre: fixture.nombre,
        fecha_partido: fixture.fecha_partido,
        leyenda: fixture.leyenda,
        texto_central: fixture.texto_central
      }
    };
  }

  // Aplicar filtros a los partidos
  private static applyFilters(matches: MatchWithPrediction[], filters: {
    zonaId?: string;
    fixtureId?: string;
    torneo?: string;
  }): MatchWithPrediction[] {
    let filteredMatches = [...matches];

    // Filtro por zona
    if (filters.zonaId) {
      filteredMatches = filteredMatches.filter(match => match.zona.id === filters.zonaId);
    }

    // Filtro por fixture (torneo)
    if (filters.torneo) {
      filteredMatches = filteredMatches.filter(match => 
        match.fixture_info?.leyenda === filters.torneo
      );
    }

    // Filtro por fixture específico
    if (filters.fixtureId) {
      filteredMatches = filteredMatches.filter(match => 
        match.fixture_info?.nombre === filters.fixtureId
      );
    }

    console.log(`🎯 Filtros aplicados: ${filteredMatches.length} partidos encontrados`);
    return filteredMatches;
  }

  // Obtener partidos locales para pruebas (fallback)
  private static getLocalMatches(userId?: string): MatchWithPrediction[] {
    const localMatches: MatchWithPrediction[] = [
      // FIXTURE 1: APERTURA 2025
      {
        id: '1',
        fecha: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '1', nombre: 'Las Flores' },
        equipo_visitante: { id: '2', nombre: 'Dief Rojo' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 1.75 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '1° FECHA',
          fecha_partido: '15/08/2025',
          leyenda: 'Apertura 2025',
          texto_central: 'Inicio del torneo'
        }
      },
      {
        id: '2',
        fecha: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '3', nombre: 'Dief Azul' },
        equipo_visitante: { id: '4', nombre: 'Cerrito F.C' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 2.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '1° FECHA',
          fecha_partido: '15/08/2025',
          leyenda: 'Apertura 2025',
          texto_central: 'Inicio del torneo'
        }
      },
      {
        id: '3',
        fecha: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '5', nombre: 'C.A Lobos' },
        equipo_visitante: { id: '6', nombre: 'Torino F.C' },
        zona: { id: '2', nombre: 'Zona 3-4' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 2.75 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '1° FECHA',
          fecha_partido: '15/08/2025',
          leyenda: 'Apertura 2025',
          texto_central: 'Inicio del torneo'
        }
      },
      {
        id: '4',
        fecha: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '7', nombre: 'AMP Altamira' },
        equipo_visitante: { id: '8', nombre: 'Cafar Negro' },
        zona: { id: '2', nombre: 'Zona 3-4' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 3.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '1° FECHA',
          fecha_partido: '15/08/2025',
          leyenda: 'Apertura 2025',
          texto_central: 'Inicio del torneo'
        }
      },

      // FIXTURE 2: CLAUSURA 2025
      {
        id: '5',
        fecha: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '9', nombre: 'B° Parque' },
        equipo_visitante: { id: '10', nombre: 'Instituto' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 3.75 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },
      {
        id: '6',
        fecha: new Date(Date.now() + 4.5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '11', nombre: 'River P. Rojo' },
        equipo_visitante: { id: '12', nombre: 'Crecer Negro' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 4.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },
      {
        id: '7',
        fecha: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '13', nombre: 'Cafar Gris' },
        equipo_visitante: { id: '14', nombre: 'River P. BCO' },
        zona: { id: '2', nombre: 'Zona 3-4' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 4.75 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },
      {
        id: '8',
        fecha: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '15', nombre: 'Lasallano' },
        equipo_visitante: { id: '16', nombre: 'Taladro' },
        zona: { id: '2', nombre: 'Zona 3-4' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 5.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },

      // FIXTURE 3: CLAUSURA 2025 (MÁS PARTIDOS)
      {
        id: '9',
        fecha: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '17', nombre: 'Racing' },
        equipo_visitante: { id: '18', nombre: 'Estrellas Sur' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 5.75 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },
      {
        id: '10',
        fecha: new Date(Date.now() + 6.5 * 60 * 60 * 1000).toISOString(),
        resultado_local: undefined,
        resultado_visitante: undefined,
        equipo_local: { id: '19', nombre: 'Mayu Sumaj' },
        equipo_visitante: { id: '20', nombre: 'Crecer NJA' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: true,
        prediction_deadline: new Date(Date.now() + 6.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '2° FECHA',
          fecha_partido: '23/08/2025',
          leyenda: 'Clausura 2025',
          texto_central: 'Segunda fecha'
        }
      },

      // PARTIDO YA JUGADO (APERTURA)
      {
        id: '11',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resultado_local: 2,
        resultado_visitante: 1,
        equipo_local: { id: '21', nombre: 'San Lorenzo' },
        equipo_visitante: { id: '22', nombre: 'Huracán' },
        zona: { id: '1', nombre: 'Zona 1-2' },
        user_prediction: undefined,
        can_predict: false,
        prediction_deadline: new Date(Date.now() - 2.25 * 60 * 60 * 1000).toISOString(),
        fixture_info: {
          nombre: '1° FECHA',
          fecha_partido: '08/08/2025',
          leyenda: 'Apertura 2025',
          texto_central: 'Primer partido'
        }
      }
    ];

    // Si hay un usuario autenticado, agregar algunas predicciones de ejemplo
    if (userId) {
      if (userId === '1') { // Juan Pérez
        localMatches[0].user_prediction = 'local';
        localMatches[1].user_prediction = 'empate';
      } else if (userId === '2') { // María González
        localMatches[0].user_prediction = 'visitante';
        localMatches[3].user_prediction = 'local';
      } else if (userId === '3') { // Carlos Rodríguez
        localMatches[1].user_prediction = 'visitante';
        localMatches[2].user_prediction = 'local';
      }
    }

    console.log('🎯 Usando partidos locales para pruebas');
    return localMatches;
  }

  // Obtener partidos por fecha
  static async getMatchesByDate(date: string, userId?: string): Promise<MatchWithPrediction[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('partidos')
        .select(`
          id,
          fecha,
          resultado_local,
          resultado_visitante,
          equipo_local: equipos!partidos_equipo_local_id_fkey (id, nombre),
          equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (id, nombre),
          zona: zonas!partidos_zona_id_fkey (id, nombre)
        `)
        .gte('fecha', startOfDay.toISOString())
        .lte('fecha', endOfDay.toISOString())
        .order('fecha', { ascending: true });

      const { data: matches, error } = await query;

      if (error) {
        console.error('Error obteniendo partidos por fecha:', error);
        return [];
      }

      // Procesar predicciones del usuario si está autenticado
      let userPredictions: { [key: string]: string } = {};
      if (userId) {
        const { data: predictions } = await supabase
          .from('prode_predictions')
          .select('partido_id, prediction')
          .eq('user_id', userId);

        if (predictions) {
          userPredictions = predictions.reduce((acc, pred) => {
            acc[pred.partido_id] = pred.prediction;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Procesar partidos
      const now = new Date();
      const config = await this.getConfig();
      const deadlineMinutes = config?.prediction_deadline_minutes || 15;

      const results = [];
      for (const match of (matches || [])) {
        const processedMatch = await this.processMatchData(match, {}, userId);
        results.push(processedMatch);
      }
      return results;
    } catch (error) {
      console.error('Error en getMatchesByDate:', error);
      return [];
    }
  }

  // Obtener partidos por categoría (a través de zona)
  static async getMatchesByCategory(categoryId: string, userId?: string): Promise<MatchWithPrediction[]> {
    try {
      // Primero obtener zonas de la categoría
      const { data: zones, error: zonesError } = await supabase
        .from('zonas')
        .select('id')
        .eq('categoria_id', categoryId);

      if (zonesError || !zones.length) {
        return [];
      }

      const zoneIds = zones.map(zone => zone.id);

      let query = supabase
        .from('partidos')
        .select(`
          id,
          fecha,
          resultado_local,
          resultado_visitante,
          equipo_local: equipos!partidos_equipo_local_id_fkey (id, nombre),
          equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (id, nombre),
          zona: zonas!partidos_zona_id_fkey (id, nombre)
        `)
        .in('zona_id', zoneIds)
        .order('fecha', { ascending: true });

      const { data: matches, error } = await query;

      if (error) {
        console.error('Error obteniendo partidos por categoría:', error);
        return [];
      }

      // Procesar predicciones del usuario
      let userPredictions: { [key: string]: string } = {};
      if (userId) {
        const { data: predictions } = await supabase
          .from('prode_predictions')
          .select('partido_id, prediction')
          .eq('user_id', userId);

        if (predictions) {
          userPredictions = predictions.reduce((acc, pred) => {
            acc[pred.partido_id] = pred.prediction;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Procesar partidos
      const results = [];
      for (const match of (matches || [])) {
        const processedMatch = await this.processMatchData(match, {}, userId);
        results.push(processedMatch);
      }
      return results;
    } catch (error) {
      console.error('Error en getMatchesByCategory:', error);
      return [];
    }
  }

  // Crear predicción de usuario
  static async createPrediction(
    userId: string,
    matchId: string,
    prediction: PredictionType,
    betAmount?: number,
    predictedScoreHome?: number,
    predictedScoreAway?: number
  ): Promise<ProdePrediction | null> {
    try {
      // Llamar API serverless para validar cutoff y upsert con monto y score
      const resp = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          match_id: matchId,
          predicted_outcome: prediction === 'local' ? 'home' : prediction === 'visitante' ? 'away' : 'draw',
          predicted_score_home: predictedScoreHome ?? null,
          predicted_score_away: predictedScoreAway ?? null,
          bet_amount: betAmount ?? 0
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error creando predicción');
      }
      const data = await resp.json();
      return data as any;
    } catch (error) {
      console.error('Error en createPrediction:', error);
      throw error;
    }
  }

  // Actualizar predicción existente
  static async updatePrediction(
    userId: string,
    matchId: string,
    prediction: PredictionType,
    betAmount?: number,
    predictedScoreHome?: number,
    predictedScoreAway?: number
  ): Promise<ProdePrediction | null> {
    try {
      // Usar mismo endpoint (upsert) con monto y score
      const resp = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          match_id: matchId,
          predicted_outcome: prediction === 'local' ? 'home' : prediction === 'visitante' ? 'away' : 'draw',
          predicted_score_home: predictedScoreHome ?? null,
          predicted_score_away: predictedScoreAway ?? null,
          bet_amount: betAmount ?? 0
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Error actualizando predicción');
      }
      const data = await resp.json();
      return data as any;
    } catch (error) {
      console.error('Error en updatePrediction:', error);
      throw error;
    }
  }

  // Obtener predicciones de un usuario
  static async getUserPredictions(userId: string): Promise<ProdePrediction[]> {
    try {
      const { data, error } = await supabase
        .from('prode_predictions')
        .select(`
          *,
          partido: partidos!prode_predictions_partido_id_fkey (
            fecha,
            equipo_local: equipos!partidos_equipo_local_id_fkey (nombre),
            equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (nombre)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo predicciones del usuario:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getUserPredictions:', error);
      return [];
    }
  }

  // Obtener estadísticas del usuario
  static async getUserStats(userId: string): Promise<UserProdeStats | null> {
    try {
      // MODO OFFLINE: Usar solo estadísticas locales
      console.log('🎯 MODO OFFLINE: Usando estadísticas locales');
      return this.getLocalUserStats(userId);

      // NOTA: Para usar datos reales, descomenta el código de abajo
      /*
      // Primero intentar obtener de la base de datos del Prode
      const { data: prodeData, error: prodeError } = await supabase
        .from('prode_user_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prodeError && prodeData) {
        console.log('📊 Estadísticas obtenidas de prode_user_scores');
        return prodeData;
      }

      // Si no hay datos del Prode, intentar obtener de la tabla de posiciones real
      try {
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select(`
            *,
            equipo: equipos!standings_equipo_id_fkey (id, nombre)
          `)
          .eq('equipo_id', userId);

        if (!standingsError && standingsData && standingsData.length > 0) {
          console.log('📊 Estadísticas obtenidas de standings reales');
          // Convertir datos de standings a formato de Prode
          const totalPoints = standingsData.reduce((sum, standing) => sum + (standing.puntos || 0), 0);
          const totalMatches = standingsData.reduce((sum, standing) => sum + (standing.pj || 0), 0);
          const wins = standingsData.reduce((sum, standing) => sum + (standing.won || 0), 0);
          const wins = standingsData.reduce((sum, standing) => sum + (standing.won || 0), 0);
          const draws = standingsData.reduce((sum, standing) => sum + (standing.drawn || 0), 0);
          
          return {
            total_points: totalPoints,
            total_points: totalPoints,
            total_predictions: totalMatches,
            correct_predictions: wins + draws, // Aproximación
            accuracy_percentage: totalMatches > 0 ? ((wins + draws) / totalMatches) * 100 : 0
          };
        }
      } catch (standingsError) {
        console.log('⚠️ Error obteniendo standings reales:', standingsError);
      }

      // Si no hay datos reales, usar estadísticas locales
      console.log('⚠️ Usando estadísticas locales como fallback');
      return this.getLocalUserStats(userId);
      */

    } catch (error) {
      console.log('⚠️ Error en BD, usando estadísticas locales');
      return this.getLocalUserStats(userId);
    }
  }

  // Obtener estadísticas locales del usuario
  private static getLocalUserStats(userId: string): UserProdeStats {
    // Estadísticas locales por defecto para cada usuario
    const localStats: { [key: string]: UserProdeStats } = {
      '1': { // Juan Pérez
        total_points: 15,
        total_predictions: 8,
        correct_predictions: 5,
        accuracy_percentage: 62.5
      },
      '2': { // María González
        total_points: 12,
        total_predictions: 6,
        correct_predictions: 4,
        accuracy_percentage: 66.7
      },
      '3': { // Carlos Rodríguez
        total_points: 18,
        total_predictions: 10,
        correct_predictions: 6,
        accuracy_percentage: 60.0
      }
    };

    return localStats[userId] || {
      total_points: 0,
      total_predictions: 0,
      correct_predictions: 0,
      accuracy_percentage: 0
    };
  }

  // Obtener tabla de posiciones
  static async getLeaderboard(): Promise<ProdeLeaderboardEntry[]> {
    try {
      // MODO OFFLINE: Usar solo tabla de posiciones local
      console.log('🎯 MODO OFFLINE: Usando tabla de posiciones local');
      return this.getLocalLeaderboard();

      // NOTA: Para usar datos reales, descomenta el código de abajo
      /*
      // Primero intentar obtener de la base de datos del Prode
      const { data: prodeData, error: prodeError } = await supabase
        .from('prode_user_scores')
        .select(`
          *,
          usuario: usuarios!prode_user_scores_user_id_fkey (nombre, apellido)
        `)
        .order('total_points', { ascending: false })
        .order('accuracy_percentage', { ascending: false });

      if (!prodeError && prodeData && prodeData.length > 0) {
        console.log('🏆 Tabla de posiciones obtenida de prode_user_scores');
        return prodeData.map((entry, index) => ({
          user_id: entry.user_id,
          user_name: `${entry.usuario?.nombre} ${entry.usuario?.apellido}`,
          total_points: entry.total_points,
          total_predictions: entry.total_predictions,
          correct_predictions: entry.correct_predictions,
          accuracy_percentage: entry.accuracy_percentage,
          rank: index + 1
        }));
      }

      // Si no hay datos del Prode, intentar obtener de la tabla de posiciones real
      try {
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select(`
            *,
            equipo: equipos!standings_equipo_id_fkey (id, nombre)
          `)
          .order('puntos', { ascending: false })
          .order('pj', { ascending: false });

        if (!standingsError && standingsData && standingsData.length > 0) {
          console.log('🏆 Tabla de posiciones obtenida de standings reales');
          // Convertir datos de standings a formato de Prode
          const leaderboardEntries: ProdeLeaderboardEntry[] = standingsData.map((standing, index) => {
            const totalPoints = standing.puntos || 0;
            const totalMatches = standing.pj || 0;
            const wins = standing.won || 0;
            const draws = standing.drawn || 0;
            const correctPredictions = wins + draws; // Aproximación
            const accuracyPercentage = totalMatches > 0 ? (correctPredictions / totalMatches) * 100 : 0;

            return {
              user_id: standing.equipo?.id || standing.teamId,
              user_name: standing.equipo?.nombre || `Equipo ${standing.teamId}`,
              total_points: totalPoints,
                  total_predictions: totalMatches,
              correct_predictions: correctPredictions,
              accuracy_percentage: accuracyPercentage,
              rank: index + 1
            };
          });

          return leaderboardEntries;
        }
      } catch (standingsError) {
        console.log('⚠️ Error obteniendo standings reales:', standingsError);
      }

      // Si no hay datos reales, usar tabla de posiciones local
      console.log('⚠️ Usando tabla de posiciones local como fallback');
      return this.getLocalLeaderboard();
      */

    } catch (error) {
      console.log('⚠️ Error en BD, usando tabla de posiciones local');
      return this.getLocalLeaderboard();
    }
  }

  // Obtener tabla de posiciones local
  private static getLocalLeaderboard(): ProdeLeaderboardEntry[] {
    return [
      {
        user_id: '3',
        user_name: 'Carlos Rodríguez',
        total_points: 18,
        total_predictions: 10,
        correct_predictions: 6,
        accuracy_percentage: 60.0,
        rank: 1
      },
      {
        user_id: '1',
        user_name: 'Juan Pérez',
        total_points: 15,
        total_predictions: 8,
        correct_predictions: 5,
        accuracy_percentage: 62.5,
        rank: 2
      },
      {
        user_id: '2',
        user_name: 'María González',
        total_points: 12,
        total_predictions: 6,
        correct_predictions: 4,
        accuracy_percentage: 66.7,
        rank: 3
      }
    ];
  }

  // Calcular puntuación de usuario
  static async calculateUserScore(userId: string): Promise<void> {
    try {
      // Ejecutar función SQL para calcular puntuación
      const { error } = await supabase.rpc('update_user_prode_score', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error calculando puntuación del usuario:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en calculateUserScore:', error);
      throw error;
    }
  }

  // Calcular resultado de un partido
  static calculateMatchResult(resultadoLocal: number, resultadoVisitante: number): PredictionType {
    if (resultadoLocal > resultadoVisitante) {
      return 'local';
    } else if (resultadoLocal < resultadoVisitante) {
      return 'visitante';
    } else {
      return 'empate';
    }
  }

  // Procesar resultados de partidos y calcular puntos
  static async processMatchResults(matchId: string): Promise<void> {
    try {
      // Obtener el partido con resultado
      const { data: match, error: matchError } = await supabase
        .from('partidos')
        .select('resultado_local, resultado_visitante')
        .eq('id', matchId)
        .single();

      if (matchError || !match.resultado_local || !match.resultado_visitante) {
        throw new Error('Partido sin resultado válido');
      }

      // Calcular resultado real
      const realResult = this.calculateMatchResult(match.resultado_local, match.resultado_visitante);

      // Obtener todas las predicciones para este partido
      const { data: predictions, error: predictionsError } = await supabase
        .from('prode_predictions')
        .select('*')
        .eq('partido_id', matchId);

      if (predictionsError) {
        throw predictionsError;
      }

      // Actualizar puntos de cada predicción
      for (const prediction of predictions || []) {
        const points = prediction.prediction === realResult ? 3 : 0;
        
        await supabase
          .from('prode_predictions')
          .update({ points_earned: points })
          .eq('id', prediction.id);

        // Recalcular puntuación del usuario
        await this.calculateUserScore(prediction.user_id);
      }
    } catch (error) {
      console.error('Error procesando resultados del partido:', error);
      throw error;
    }
  }

  // Obtener predicciones de un partido específico
  static async getMatchPredictions(matchId: string): Promise<{
    local: number;
    empate: number;
    visitante: number;
    total: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('prode_predictions')
        .select('prediction')
        .eq('partido_id', matchId);

      if (error) {
        console.error('Error obteniendo predicciones del partido:', error);
        return { local: 0, empate: 0, visitante: 0, total: 0 };
      }

      const predictions = data || [];
      const counts = {
        local: predictions.filter(p => p.prediction === 'local').length,
        empate: predictions.filter(p => p.prediction === 'empate').length,
        visitante: predictions.filter(p => p.prediction === 'visitante').length,
        total: predictions.length
      };

      return counts;
    } catch (error) {
      console.error('Error en getMatchPredictions:', error);
      return { local: 0, empate: 0, visitante: 0, total: 0 };
    }
  }
}
