import { describe, expect, it } from 'vitest';
import { UNIT_CATEGORIES, convertUnit, metersToFeetInches } from '../src/processors/unitConverter';

describe('unitConverter', () => {
  it('converts length', () => {
    expect(convertUnit(1, 'length', 'm', 'cm')).toBeCloseTo(100);
    expect(convertUnit(1, 'length', 'in', 'cm')).toBeCloseTo(2.54);
    expect(convertUnit(1, 'length', 'mi', 'km')).toBeCloseTo(1.609344);
    expect(convertUnit(3, 'length', 'ft', 'm')).toBeCloseTo(0.9144);
  });

  it('converts mass', () => {
    expect(convertUnit(1, 'mass', 'lb', 'kg')).toBeCloseTo(0.45359237);
    expect(convertUnit(16, 'mass', 'oz', 'lb')).toBeCloseTo(1);
    expect(convertUnit(1, 'mass', 't', 'kg')).toBe(1000);
  });

  it('converts volume', () => {
    expect(convertUnit(1, 'volume', 'gal', 'l')).toBeCloseTo(3.785411784);
    expect(convertUnit(8, 'volume', 'floz', 'cup')).toBeCloseTo(1);
    expect(convertUnit(2, 'volume', 'cup', 'pt')).toBeCloseTo(1);
  });

  it('converts temperature in all directions', () => {
    expect(convertUnit(0, 'temperature', 'c', 'f')).toBeCloseTo(32);
    expect(convertUnit(212, 'temperature', 'f', 'c')).toBeCloseTo(100);
    expect(convertUnit(0, 'temperature', 'c', 'k')).toBeCloseTo(273.15);
    expect(convertUnit(-40, 'temperature', 'f', 'c')).toBeCloseTo(-40);
  });

  it('converts area', () => {
    expect(convertUnit(1, 'area', 'km2', 'm2')).toBe(1e6);
    expect(convertUnit(1, 'area', 'acre', 'm2')).toBeCloseTo(4046.8564224);
    expect(convertUnit(1, 'area', 'mi2', 'acre')).toBeCloseTo(640);
  });

  it('converts speed', () => {
    expect(convertUnit(36, 'speed', 'kmh', 'mps')).toBeCloseTo(10);
    expect(convertUnit(1, 'speed', 'knot', 'kmh')).toBeCloseTo(1.852);
    expect(convertUnit(60, 'speed', 'mph', 'kmh')).toBeCloseTo(96.56064);
  });

  it('converts time', () => {
    expect(convertUnit(2, 'time', 'd', 'h')).toBe(48);
    expect(convertUnit(1, 'time', 'w', 'd')).toBe(7);
    expect(convertUnit(90, 'time', 'min', 'h')).toBeCloseTo(1.5);
  });

  it('round-trips through every unit of every category', () => {
    for (const cat of UNIT_CATEGORIES) {
      for (const u of cat.units) {
        const base = cat.units[0].id;
        const there = convertUnit(123.456, cat.id, u.id, base);
        const back = convertUnit(there, cat.id, base, u.id);
        expect(back).toBeCloseTo(123.456, 6);
      }
    }
  });

  it('returns NaN for unknown units and non-finite values', () => {
    expect(convertUnit(1, 'length', 'nope', 'm')).toBeNaN();
    expect(convertUnit(Infinity, 'length', 'm', 'cm')).toBeNaN();
  });

  it('produces US composite feet+inches (173 cm ≈ 5 ft 8.1 in)', () => {
    const m = convertUnit(173, 'length', 'cm', 'm');
    const { feet, inches } = metersToFeetInches(m);
    expect(feet).toBe(5);
    expect(inches).toBeCloseTo(8.1, 1);
  });
});
