export interface NbaTeam {
  abbr: string
  name: string // short name, e.g. "Hawks"
  city: string
  conf: 'East' | 'West'
  div: string
  primary: string
  secondary: string
}

// The canonical 30-team seed list — source of truth for both the League
// Creation Wizard (full city/name/conf/div) and the Dashboard (keyed lookup).
export const NBA_TEAMS: NbaTeam[] = [
  { abbr: 'ATL', name: 'Hawks', city: 'Atlanta', conf: 'East', div: 'Southeast', primary: '#E03A3E', secondary: '#C1D32F' },
  { abbr: 'BOS', name: 'Celtics', city: 'Boston', conf: 'East', div: 'Atlantic', primary: '#007A33', secondary: '#BA9653' },
  { abbr: 'BKN', name: 'Nets', city: 'Brooklyn', conf: 'East', div: 'Atlantic', primary: '#000000', secondary: '#FFFFFF' },
  { abbr: 'CHA', name: 'Hornets', city: 'Charlotte', conf: 'East', div: 'Southeast', primary: '#1D1160', secondary: '#00788C' },
  { abbr: 'CHI', name: 'Bulls', city: 'Chicago', conf: 'East', div: 'Central', primary: '#CE1141', secondary: '#000000' },
  { abbr: 'CLE', name: 'Cavaliers', city: 'Cleveland', conf: 'East', div: 'Central', primary: '#860038', secondary: '#FDBB30' },
  { abbr: 'DAL', name: 'Mavericks', city: 'Dallas', conf: 'West', div: 'Southwest', primary: '#00538C', secondary: '#002B5E' },
  { abbr: 'DEN', name: 'Nuggets', city: 'Denver', conf: 'West', div: 'Northwest', primary: '#0E2240', secondary: '#FEC524' },
  { abbr: 'DET', name: 'Pistons', city: 'Detroit', conf: 'East', div: 'Central', primary: '#C8102E', secondary: '#1D42BA' },
  { abbr: 'GSW', name: 'Warriors', city: 'San Francisco', conf: 'West', div: 'Pacific', primary: '#1D428A', secondary: '#FFC72C' },
  { abbr: 'HOU', name: 'Rockets', city: 'Houston', conf: 'West', div: 'Southwest', primary: '#CE1141', secondary: '#000000' },
  { abbr: 'IND', name: 'Pacers', city: 'Indiana', conf: 'East', div: 'Central', primary: '#002D62', secondary: '#FDBB30' },
  { abbr: 'LAC', name: 'Clippers', city: 'Los Angeles', conf: 'West', div: 'Pacific', primary: '#C8102E', secondary: '#1D428A' },
  { abbr: 'LAL', name: 'Lakers', city: 'Los Angeles', conf: 'West', div: 'Pacific', primary: '#552583', secondary: '#FDB927' },
  { abbr: 'MEM', name: 'Grizzlies', city: 'Memphis', conf: 'West', div: 'Southwest', primary: '#5D76A9', secondary: '#12173F' },
  { abbr: 'MIA', name: 'Heat', city: 'Miami', conf: 'East', div: 'Southeast', primary: '#98002E', secondary: '#F9A01B' },
  { abbr: 'MIL', name: 'Bucks', city: 'Milwaukee', conf: 'East', div: 'Central', primary: '#00471B', secondary: '#EEE1C6' },
  { abbr: 'MIN', name: 'Timberwolves', city: 'Minnesota', conf: 'West', div: 'Northwest', primary: '#0C2340', secondary: '#236192' },
  { abbr: 'NOP', name: 'Pelicans', city: 'New Orleans', conf: 'West', div: 'Southwest', primary: '#0C2340', secondary: '#C8102E' },
  { abbr: 'NYK', name: 'Knicks', city: 'New York', conf: 'East', div: 'Atlantic', primary: '#006BB6', secondary: '#F58426' },
  { abbr: 'OKC', name: 'Thunder', city: 'Oklahoma City', conf: 'West', div: 'Northwest', primary: '#007AC1', secondary: '#EF3B24' },
  { abbr: 'ORL', name: 'Magic', city: 'Orlando', conf: 'East', div: 'Southeast', primary: '#0077C0', secondary: '#000000' },
  { abbr: 'PHI', name: '76ers', city: 'Philadelphia', conf: 'East', div: 'Atlantic', primary: '#006BB6', secondary: '#ED174C' },
  { abbr: 'PHX', name: 'Suns', city: 'Phoenix', conf: 'West', div: 'Pacific', primary: '#1D1160', secondary: '#E56020' },
  { abbr: 'POR', name: 'Trail Blazers', city: 'Portland', conf: 'West', div: 'Northwest', primary: '#E03A3E', secondary: '#000000' },
  { abbr: 'SAC', name: 'Kings', city: 'Sacramento', conf: 'West', div: 'Pacific', primary: '#5A2D81', secondary: '#63727A' },
  { abbr: 'SAS', name: 'Spurs', city: 'San Antonio', conf: 'West', div: 'Southwest', primary: '#C4CED4', secondary: '#000000' },
  { abbr: 'TOR', name: 'Raptors', city: 'Toronto', conf: 'East', div: 'Atlantic', primary: '#CE1141', secondary: '#000000' },
  { abbr: 'UTA', name: 'Jazz', city: 'Utah', conf: 'West', div: 'Northwest', primary: '#002B5C', secondary: '#00471B' },
  { abbr: 'WAS', name: 'Wizards', city: 'Washington', conf: 'East', div: 'Southeast', primary: '#002B5C', secondary: '#E31837' }
]

export const TEAM_DATA: Record<string, NbaTeam> = Object.fromEntries(NBA_TEAMS.map((t) => [t.abbr, t]))

export function fullTeamName(abbr: string): string {
  const t = TEAM_DATA[abbr]
  return t ? `${t.city} ${t.name}` : abbr
}
