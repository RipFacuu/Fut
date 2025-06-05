// Mock data for development
import { League, Category, Zone, Team, Fixture, Standing, Match } from '../contexts/LeagueContext';

// Leagues
const leagues: League[] = [
  {
    id: 'liga_masculina',
    name: 'Liga Masculina',
    description: 'Competición de fútbol masculino',
    logo: '/images/liga-masculina.svg'
  },
  {
    id: 'lifufe',
    name: 'LIFUFE',
    description: 'Liga de Fútbol Femenino',
    logo: '/images/lifufe.svg'
  },
  {
    id: 'mundialito',
    name: 'Mundialito',
    description: 'Competición internacional de fútbol',
    logo: '/images/mundialito.svg'
  }
];

// Categories - Eliminar categorías de LIFUFE y Mundialito
const categories: Category[] = [
  // Solo mantener categorías de Liga Masculina si las hay, o dejar vacío
];

// Zones - Eliminar zonas de LIFUFE y Mundialito
const zones: Zone[] = [
  // Liga Masculina zones (mantener solo estas si existen)
  {
    id: 'zone_liga_masc_primera_norte',
    name: 'Zona Norte',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera'
  },
  {
    id: 'zone_liga_masc_primera_sur',
    name: 'Zona Sur',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera'
  },
  {
    id: 'zone_liga_masc_segunda_unica',
    name: 'Zona Única',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_segunda'
  }
  // Eliminar todas las zonas de LIFUFE y Mundialito
];

// Teams - Vaciar para empezar sin equipos preestablecidos
const teams: Team[] = [];

// Sample matches for a fixture
const sampleMatches1: Match[] = [
  {
    id: 'match_1',
    fixtureId: 'fixture_1',
    homeTeamId: 'team_1',
    awayTeamId: 'team_2',
    homeScore: 2,
    awayScore: 1,
    played: true
  },
  {
    id: 'match_2',
    fixtureId: 'fixture_1',
    homeTeamId: 'team_3',
    awayTeamId: 'team_4',
    homeScore: 0,
    awayScore: 0,
    played: true
  }
];

const sampleMatches2: Match[] = [
  {
    id: 'match_3',
    fixtureId: 'fixture_2',
    homeTeamId: 'team_2',
    awayTeamId: 'team_3',
    homeScore: 1,
    awayScore: 3,
    played: true
  },
  {
    id: 'match_4',
    fixtureId: 'fixture_2',
    homeTeamId: 'team_4',
    awayTeamId: 'team_1',
    played: false
  }
];

// Fixtures - Eliminar fixtures de LIFUFE
const fixtures: Fixture[] = [
  {
    id: 'fixture_1',
    date: '1° FECHA',
    matchDate: '29 DE MARZO',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    matches: sampleMatches1
  },
  {
    id: 'fixture_2',
    date: '2° FECHA',
    matchDate: '5 DE ABRIL',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    matches: sampleMatches2
  }
  // Eliminar fixture_3 que pertenece a LIFUFE
];

// Standings - Eliminar standings de LIFUFE
const standings: Standing[] = [
  // Liga Masculina - Primera División - Zona Norte (mantener solo estos)
  {
    id: 'standing_1',
    teamId: 'team_1',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    points: 3,
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    goalsFor: 2,
    goalsAgainst: 1
  },
  {
    id: 'standing_2',
    teamId: 'team_2',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    points: 0,
    played: 1,
    won: 0,
    drawn: 0,
    lost: 1,
    goalsFor: 1,
    goalsAgainst: 2
  },
  {
    id: 'standing_3',
    teamId: 'team_3',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    points: 1,
    played: 1,
    won: 0,
    drawn: 1,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0
  },
  {
    id: 'standing_4',
    teamId: 'team_4',
    leagueId: 'liga_masculina',
    categoryId: 'cat_liga_masc_primera',
    zoneId: 'zone_liga_masc_primera_norte',
    points: 1,
    played: 1,
    won: 0,
    drawn: 1,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0
  }
  // Eliminar standing_9, standing_10, standing_11, standing_12 de LIFUFE
];

// Export mock data - Mantener las ligas pero sin datos preestablecidos
export const mockLeagueData = {
  leagues: [
    {
      id: '1',
      name: 'Liga Masculina',
      description: 'Liga masculina de fútbol',
      season: '2024'
    },
    {
      id: 'lifufe',
      name: 'LIFUFE',
      description: 'Liga de Fútbol Femenino',
      logo: undefined
    },
    {
      id: 'mundialito',
      name: 'Mundialito',
      description: 'Torneo',
      logo: undefined
    }
  ],
  categories: categories,
  zones: zones,
  teams: teams,
  fixtures: fixtures,
  standings: standings
};