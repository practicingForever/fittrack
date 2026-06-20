import type { WeightUnit } from './types'

const PREF_KEY = 'unit_pref'

export function getUnitPref(): WeightUnit {
  return (localStorage.getItem(PREF_KEY) as WeightUnit) ?? 'kg'
}

export function setUnitPref(unit: WeightUnit) {
  localStorage.setItem(PREF_KEY, unit)
}

export function toDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? Math.round(kg * 2.20462 * 10) / 10 : kg
}

export function toKg(val: number, unit: WeightUnit): number {
  return unit === 'lbs' ? val / 2.20462 : val
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${toDisplay(kg, unit)} ${unit}`
}
