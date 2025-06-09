const getCategoriesByLeague = (leagueId: string) => {
  // Validación de entrada
  if (!leagueId) {
    return [];
  }

  try {
    const league = getLeague(leagueId);
    
    // Verificar que league existe y tiene la propiedad id
    if (!league || !league.id) {
      return [];
    }

    // Verificar que categories está definido
    if (!categories || !Array.isArray(categories)) {
      console.warn('Categories array is not defined or not an array');
      return [];
    }

    if (league.id === '1') {
      // Para Liga Participando, retornar solo categorías editables
      return categories.filter(category => 
        category && 
        category.leagueId === leagueId && 
        category.isEditable === true
      );
    }
    
    // Para otras ligas, retornar todas las categorías
    return categories.filter(category => 
      category && category.leagueId === leagueId
    );
    
  } catch (error) {
    console.error('Error in getCategoriesByLeague:', error);
    return [];
  }
};