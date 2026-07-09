import type { RosterPlayer } from '@shared/types'

// The human's starting roster template — kept hand-curated (a genuine
// star-studded flavor hook for whichever real team the wizard assigns it
// to), unlike every other team's procedurally generated roster.
// `potential` is deliberately omitted here and re-rolled fresh by
// cloneMyRosterTemplate() each new game (engine.ts) — replay variance instead
// of a fixed hand-tuned ceiling on all 15 hand-curated rows.
export const LAL_ROSTER: Omit<RosterPlayer, 'potential'>[] = [
  { id: 1, name: 'K. Coleman', pos: 'PG', age: 28, ovr: 94, pts: 24.8, reb: 4.2, ast: 9.2, salary: 35200000, yrs: 3, status: 'Active' },
  { id: 2, name: 'D. Reeves', pos: 'SG', age: 26, ovr: 88, pts: 18.4, reb: 3.8, ast: 4.6, salary: 22800000, yrs: 2, status: 'Active' },
  { id: 3, name: 'A. Brown', pos: 'SF', age: 29, ovr: 80, pts: 10.4, reb: 4.8, ast: 1.8, salary: 10200000, yrs: 1, status: 'Active' },
  { id: 4, name: 'T. Williams', pos: 'PF', age: 30, ovr: 85, pts: 16.8, reb: 9.4, ast: 2.2, salary: 16400000, yrs: 1, status: 'GTD' },
  { id: 5, name: 'C. Grant', pos: 'C', age: 27, ovr: 87, pts: 15.6, reb: 11.2, ast: 2.4, salary: 19600000, yrs: 2, status: 'Active' },
  { id: 6, name: 'R. Santos', pos: 'PG', age: 23, ovr: 78, pts: 9.4, reb: 2.8, ast: 5.6, salary: 7800000, yrs: 3, status: 'Active' },
  { id: 7, name: 'M. Johnson', pos: 'SG', age: 24, ovr: 76, pts: 8.2, reb: 2.4, ast: 2.2, salary: 6800000, yrs: 2, status: 'Active' },
  { id: 8, name: 'S. Rivera', pos: 'SF', age: 27, ovr: 77, pts: 6.8, reb: 3.6, ast: 1.4, salary: 7200000, yrs: 1, status: 'Active' },
  { id: 9, name: 'E. Davis', pos: 'PF', age: 32, ovr: 75, pts: 7.8, reb: 6.2, ast: 1.4, salary: 8400000, yrs: 1, status: 'OUT' },
  { id: 10, name: 'N. Ford', pos: 'C', age: 26, ovr: 72, pts: 6.4, reb: 7.8, ast: 1.2, salary: 4800000, yrs: 2, status: 'Active' },
  { id: 11, name: 'B. Chen', pos: 'PG', age: 22, ovr: 70, pts: 4.2, reb: 1.8, ast: 3.4, salary: 3200000, yrs: 3, status: 'Active' },
  { id: 12, name: 'L. Thomas', pos: 'SG', age: 21, ovr: 68, pts: 3.8, reb: 1.4, ast: 1.6, salary: 2400000, yrs: 3, status: 'Active' },
  { id: 13, name: 'P. Anderson', pos: 'PF', age: 28, ovr: 74, pts: 5.2, reb: 5.4, ast: 0.8, salary: 6400000, yrs: 2, status: 'Active' },
  { id: 14, name: 'O. Wallace', pos: 'C', age: 24, ovr: 71, pts: 4.8, reb: 6.4, ast: 1.0, salary: 3600000, yrs: 3, status: 'INJ' },
  { id: 15, name: 'J. Pierce', pos: 'SF', age: 25, ovr: 73, pts: 5.6, reb: 3.2, ast: 1.4, salary: 5800000, yrs: 2, status: 'Active' }
]

// Shared combinatorial name pool — used both for draft prospects and for
// generating every CPU team's roster, so a 30-team league (450 players)
// doesn't collide on names the way the old 15-entry PNAMES list did.
export const FIRST_INITIALS = 'ABCDEFGHJKLMNOPRSTW'.split('')
export const SURNAMES = [
  'Jackson', 'Williams', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Thomas',
  'Parker', 'Harris', 'Martin', 'White', 'Thompson', 'Lewis', 'Walker', 'Hall', 'Young', 'King',
  'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Turner',
  'Phillips', 'Campbell', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Rogers', 'Reed', 'Bell', 'Cooper',
  'Rivera', 'Cox', 'Howard', 'Torres', 'Gray', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price',
  'Bennett', 'Flores', 'Sanchez', 'Ramirez', 'Coleman', 'Reeves', 'Santos', 'Ford', 'Chen', 'Pierce',
  'Vasquez', 'Osei', 'Nakamura', 'Mensah', 'Morrison', 'Okafor', 'Larsson', 'Kimura', 'Singh', 'Kowalski',
  'Baptiste', 'Adeyemi', 'Rashid', 'Mbenga', 'Volkov', 'Nwachukwu', 'Robertson'
]

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
