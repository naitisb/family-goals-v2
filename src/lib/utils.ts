// Utility functions

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getWeekEnd(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7) // Sunday end
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getMonthStart(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  return d.toISOString().split('T')[0]
}

export function getMonthEnd(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return d.toISOString().split('T')[0]
}

export function getYearStart(date: Date = new Date()): string {
  return `${date.getFullYear()}-01-01`
}

export function getYearEnd(date: Date = new Date()): string {
  return `${date.getFullYear()}-12-31`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Water unit conversion
export const WATER_UNITS = [
  { id: 'ml', label: 'Milliliters (ml)', factor: 1 },
  { id: 'L', label: 'Liters (L)', factor: 1000 },
  { id: 'oz', label: 'Fluid Ounces (oz)', factor: 29.5735 },
  { id: 'cups', label: 'Cups', factor: 236.588 }
]

export function convertWaterToMl(value: number, unit: string): number {
  const unitData = WATER_UNITS.find(u => u.id === unit) || WATER_UNITS[0]
  return Math.round(value * unitData.factor)
}

export function convertMlToUnit(ml: number, unit: string): number {
  const unitData = WATER_UNITS.find(u => u.id === unit) || WATER_UNITS[0]
  return Math.round((ml / unitData.factor) * 10) / 10
}

// Avatar colors
export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
  '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#57534e',
  '#b91c1c', '#c2410c', '#b45309', '#a16207', '#4d7c0f', '#15803d',
]

// Gradient themes
export const GRADIENT_THEMES = [
  { id: 'default', name: 'Default', value: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)' },
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #1a0a1f 0%, #2d1b3d 30%, #4a2c4a 70%, #1a0a1f 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #0a1628 0%, #1a2744 30%, #0d3b66 70%, #0a1628 100%)' },
  { id: 'forest', name: 'Forest', value: 'linear-gradient(135deg, #0a1f0a 0%, #1a3d1a 30%, #2d5a2d 70%, #0a1f0a 100%)' },
  { id: 'candy', name: 'Candy', value: 'linear-gradient(135deg, #1f0a28 0%, #3d1a4d 30%, #5a2d6a 70%, #1f0a28 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #0a0a1f 0%, #1a1a3d 30%, #2d2d5a 70%, #0a0a1f 100%)' },
]

