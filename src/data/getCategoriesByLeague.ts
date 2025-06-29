import { Category, League } from '../contexts/LeagueContext';
import { mockData } from './mockData';

const getCategoriesByLeague = (leagueId: string | number): Category[] => {
  // Validación de entrada
  if (!leagueId) {
    return [];
  }

  try {
    // Obtener la liga desde mockData
    const league = mockData.leagues.find((l: League) => l.id === String(leagueId));
    
    // Verificar que league existe y tiene la propiedad id
    if (!league || !league.id) {
      return [];
    }

    // Obtener categorías desde mockData
    const categories = mockData.categories;
    
    // Verificar que categories está definido
    if (!categories || !Array.isArray(categories)) {
      console.warn('Categories array is not defined or not an array');
      return [];
    }

    // Normalizar leagueId para comparación consistente
    const normalizedLeagueId = String(leagueId);

    if (league.id === 'liga_masculina') {
      // Para Liga Masculina, retornar solo categorías editables
      return categories.filter(category => 
        category && 
        String(category.leagueId) === normalizedLeagueId && 
        category.isEditable === true
      );
    }
    
    // Para otras ligas, retornar todas las categorías
    return categories.filter(category => 
      category && String(category.leagueId) === normalizedLeagueId
    );
    
  } catch (error) {
    console.error('Error in getCategoriesByLeague:', error);
    return [];
  }
};

export default getCategoriesByLeague;