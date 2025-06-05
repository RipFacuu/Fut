const getCategoriesByLeague = (leagueId: string) => {
    const league = getLeague(leagueId);
    if (league?.id === 'liga_masculina') {
      // Para Liga Participando, retornar solo categorías editables
      return categories.filter(category => 
        category.leagueId === leagueId && category.isEditable
      );
    }
    return categories.filter(category => category.leagueId === leagueId);
};