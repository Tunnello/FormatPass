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
})
