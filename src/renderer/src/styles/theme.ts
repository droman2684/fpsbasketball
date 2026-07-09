export const COLORS = {
  bg: '#F7F6F3',
  surface: '#FFFFFF',
  textPrimary: '#141412',
  textMuted: '#767672',
  textFaint: '#AEACA8',
  border: '#E5E3DF',
  accent: 'oklch(0.62 0.21 42)',
  accentLight: 'oklch(0.95 0.04 42)',
  navDark: '#0D0D0B',
  contextDark: '#1A1A17',
  sidebarDark: '#141412',
  winGreen: 'oklch(0.52 0.17 140)',
  lossRed: '#CE1141',
  ovrA: 'oklch(0.55 0.21 42)',
  ovrB: '#1D428A',
  ovrC: '#5D76A9',
  ovrD: '#AEACA8'
} as const

export const FONTS = {
  display: "'Barlow Condensed', sans-serif",
  body: "'Barlow', sans-serif",
  mono: "'IBM Plex Mono', monospace"
} as const

export function ovrColor(o: number): string {
  return o >= 90 ? COLORS.ovrA : o >= 80 ? COLORS.ovrB : o >= 70 ? COLORS.ovrC : COLORS.ovrD
}

export function fmtMoney(n: number): string {
  return '$' + (n / 1e6).toFixed(1) + 'M'
}

export function getTextColor(hex: string | undefined): string {
  if (!hex || hex.length < 7) return '#ffffff'
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.52 ? '#111111' : '#ffffff'
}

// Segmented-control helpers: active button uses accent fill / white text,
// inactive uses white fill / dark text with a plain border.
export const seg = {
  bg: (active: boolean): string => (active ? COLORS.accent : '#FFFFFF'),
  fg: (active: boolean): string => (active ? '#FFFFFF' : COLORS.textPrimary),
  border: (active: boolean): string => (active ? COLORS.accent : COLORS.border),
  z: (active: boolean): number => (active ? 2 : 1)
}
