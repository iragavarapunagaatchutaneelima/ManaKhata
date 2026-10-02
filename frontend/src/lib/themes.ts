// Selectable Kinfold themes. Each id maps to a [data-theme="…"] token block in
// globals.css. "dark" and "light" double as the targets of "Match my device".

export interface ThemeDef {
  id: string
  name: string
  description: string
  dark: boolean
  /** Preview swatches: background, card, primary, accent. */
  swatch: [string, string, string, string]
}

export const THEMES: ThemeDef[] = [
  { id: 'dark', name: 'Midnight', description: 'Deep night-indigo with saffron highlights', dark: true, swatch: ['#0A0E1C', '#121831', '#8C9BFF', '#F4B850'] },
  { id: 'amoled', name: 'Pure Black', description: 'True black for OLED phones — easy on the battery', dark: true, swatch: ['#000000', '#0E0E12', '#8F9CFF', '#F4B850'] },
  { id: 'graphite', name: 'Graphite', description: 'Neutral greys with a warm coral accent', dark: true, swatch: ['#111113', '#1B1B1E', '#FF7A63', '#7FA8FF'] },
  { id: 'plum', name: 'Plum Night', description: 'Deep plum with lilac and amber', dark: true, swatch: ['#120E18', '#1D1627', '#C4A3FF', '#EDB45F'] },
  { id: 'ocean', name: 'Ocean Deep', description: 'Navy-teal with cyan and gold', dark: true, swatch: ['#06121A', '#0E1E29', '#4FC3E0', '#F0BB55'] },
  { id: 'light', name: 'Daylight', description: 'Cool white with indigo and saffron', dark: false, swatch: ['#F6F7FB', '#FFFFFF', '#3B4BC8', '#E59A1C'] },
  { id: 'sand', name: 'Sand', description: 'Warm sand with plum and amber', dark: false, swatch: ['#F7F3EC', '#FFFDF9', '#6B3FA0', '#C9852E'] },
]

export const THEME_IDS = THEMES.map((t) => t.id)
export const DEFAULT_THEME = 'dark'
export const themeById = (id: string | undefined) => THEMES.find((t) => t.id === id)
