export function twipToCm(twip: number): number {
  return (twip * 2.54) / 1440
}

export function cmToTwip(cm: number): number {
  return Math.round((cm * 1440) / 2.54)
}

export function twipToPt(twip: number): number {
  return twip / 20
}

export function ptToTwip(pt: number): number {
  return Math.round(pt * 20)
}

export function halfPointToPt(hp: number): number {
  return hp / 2
}

export function ptToHalfPoint(pt: number): number {
  return Math.round(pt * 2)
}
