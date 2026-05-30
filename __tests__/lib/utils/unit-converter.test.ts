import {
  twipToCm,
  cmToTwip,
  twipToPt,
  ptToTwip,
  halfPointToPt,
  ptToHalfPoint,
} from '@/lib/utils/unit-converter'

describe('unit-converter', () => {
  test('twipToCm converts 1440 twips to ~2.54 cm', () => {
    expect(twipToCm(1440)).toBeCloseTo(2.54, 4)
  })

  test('cmToTwip converts 2.54 cm to 1440 twips', () => {
    expect(cmToTwip(2.54)).toBe(1440)
  })

  test('twipToPt converts 240 twips to 12 pt', () => {
    expect(twipToPt(240)).toBe(12)
  })

  test('ptToTwip converts 12 pt to 240 twips', () => {
    expect(ptToTwip(12)).toBe(240)
  })

  test('halfPointToPt converts 24 half-points to 12 pt', () => {
    expect(halfPointToPt(24)).toBe(12)
  })

  test('ptToHalfPoint converts 12 pt to 24 half-points', () => {
    expect(ptToHalfPoint(12)).toBe(24)
  })

  describe('zero inputs', () => {
    test('twipToCm(0) returns 0', () => {
      expect(twipToCm(0)).toBe(0)
    })

    test('cmToTwip(0) returns 0', () => {
      expect(cmToTwip(0)).toBe(0)
    })

    test('twipToPt(0) returns 0', () => {
      expect(twipToPt(0)).toBe(0)
    })

    test('ptToTwip(0) returns 0', () => {
      expect(ptToTwip(0)).toBe(0)
    })

    test('halfPointToPt(0) returns 0', () => {
      expect(halfPointToPt(0)).toBe(0)
    })

    test('ptToHalfPoint(0) returns 0', () => {
      expect(ptToHalfPoint(0)).toBe(0)
    })
  })

  describe('negative inputs', () => {
    test('twipToCm handles negative values', () => {
      expect(twipToCm(-1440)).toBeCloseTo(-2.54, 4)
    })

    test('cmToTwip handles negative values', () => {
      expect(cmToTwip(-2.54)).toBe(-1440)
    })

    test('twipToPt handles negative values', () => {
      expect(twipToPt(-240)).toBe(-12)
    })

    test('ptToTwip handles negative values', () => {
      expect(ptToTwip(-12)).toBe(-240)
    })

    test('halfPointToPt handles negative values', () => {
      expect(halfPointToPt(-24)).toBe(-12)
    })

    test('ptToHalfPoint handles negative values', () => {
      expect(ptToHalfPoint(-12)).toBe(-24)
    })
  })

  describe('rounding behavior', () => {
    test('cmToTwip(1) returns 567', () => {
      expect(cmToTwip(1)).toBe(567)
    })

    test('ptToTwip(0.5) returns 10', () => {
      expect(ptToTwip(0.5)).toBe(10)
    })

    test('ptToHalfPoint(0.5) returns 1', () => {
      expect(ptToHalfPoint(0.5)).toBe(1)
    })
  })

  describe('round-trip', () => {
    test('twipToCm(cmToTwip(5)) is close to 5', () => {
      expect(twipToCm(cmToTwip(5))).toBeCloseTo(5, 2)
    })
  })
})
