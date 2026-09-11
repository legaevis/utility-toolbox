/**
 * Unit Converter — pure math, fully offline.
 *
 * Data-driven: adding a category or a unit = adding a table entry.
 * Conversion always goes through the category's base unit with exact
 * factors; presentation (locale formatting, ft+in composite) happens
 * separately in the UI via LocaleService.
 */

export type UnitCategoryId =
  | 'length'
  | 'mass'
  | 'volume'
  | 'temperature'
  | 'area'
  | 'speed'
  | 'time';

export interface UnitDef {
  id: string;
  /** Multiplier to the category's base unit (exact where defined exactly). */
  toBase: number;
}

export interface UnitCategory {
  id: UnitCategoryId;
  units: UnitDef[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length', // base: meter
    units: [
      { id: 'mm', toBase: 0.001 },
      { id: 'cm', toBase: 0.01 },
      { id: 'm', toBase: 1 },
      { id: 'km', toBase: 1000 },
      { id: 'in', toBase: 0.0254 },
      { id: 'ft', toBase: 0.3048 },
      { id: 'yd', toBase: 0.9144 },
      { id: 'mi', toBase: 1609.344 },
    ],
  },
  {
    id: 'mass', // base: kilogram
    units: [
      { id: 'g', toBase: 0.001 },
      { id: 'kg', toBase: 1 },
      { id: 't', toBase: 1000 },
      { id: 'oz', toBase: 0.028349523125 },
      { id: 'lb', toBase: 0.45359237 },
    ],
  },
  {
    id: 'volume', // base: liter (US customary for imperial-ish units)
    units: [
      { id: 'ml', toBase: 0.001 },
      { id: 'l', toBase: 1 },
      { id: 'floz', toBase: 0.0295735295625 },
      { id: 'cup', toBase: 0.2365882365 },
      { id: 'pt', toBase: 0.473176473 },
      { id: 'gal', toBase: 3.785411784 },
    ],
  },
  {
    id: 'temperature', // special-cased below
    units: [
      { id: 'c', toBase: 1 },
      { id: 'f', toBase: 1 },
      { id: 'k', toBase: 1 },
    ],
  },
  {
    id: 'area', // base: square meter
    units: [
      { id: 'm2', toBase: 1 },
      { id: 'km2', toBase: 1e6 },
      { id: 'ft2', toBase: 0.09290304 },
      { id: 'mi2', toBase: 2589988.110336 },
      { id: 'acre', toBase: 4046.8564224 },
    ],
  },
  {
    id: 'speed', // base: meter per second
    units: [
      { id: 'mps', toBase: 1 },
      { id: 'kmh', toBase: 1000 / 3600 },
      { id: 'mph', toBase: 0.44704 },
      { id: 'knot', toBase: 1852 / 3600 },
    ],
  },
  {
    id: 'time', // base: second
    units: [
      { id: 's', toBase: 1 },
      { id: 'min', toBase: 60 },
      { id: 'h', toBase: 3600 },
      { id: 'd', toBase: 86400 },
      { id: 'w', toBase: 604800 },
    ],
  },
];

export function getCategory(id: UnitCategoryId): UnitCategory {
  const cat = UNIT_CATEGORIES.find((c) => c.id === id);
  if (!cat) throw new Error(`Unknown unit category: ${id}`);
  return cat;
}

function toCelsius(value: number, from: string): number {
  switch (from) {
    case 'c':
      return value;
    case 'f':
      return ((value - 32) * 5) / 9;
    case 'k':
      return value - 273.15;
    default:
      return NaN;
  }
}

function fromCelsius(value: number, to: string): number {
  switch (to) {
    case 'c':
      return value;
    case 'f':
      return (value * 9) / 5 + 32;
    case 'k':
      return value + 273.15;
    default:
      return NaN;
  }
}

/** Exact numeric conversion. Returns NaN for unknown units. */
export function convertUnit(
  value: number,
  category: UnitCategoryId,
  from: string,
  to: string,
): number {
  if (!Number.isFinite(value)) return NaN;
  if (category === 'temperature') return fromCelsius(toCelsius(value, from), to);
  const cat = getCategory(category);
  const fromDef = cat.units.find((u) => u.id === from);
  const toDef = cat.units.find((u) => u.id === to);
  if (!fromDef || !toDef) return NaN;
  return (value * fromDef.toBase) / toDef.toBase;
}

/** US-style composite length: 1.7526 m → { feet: 5, inches: 9 }.
 *  Presentation only — the exact value is never rounded internally. */
export function metersToFeetInches(meters: number): { feet: number; inches: number } {
  const totalInches = meters / 0.0254;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}
