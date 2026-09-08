import type { Booster, ScoreBreakdown } from "./types";

/**
 * The single place points are worked out. Pure, so the gamemaster's
 * "here's what you'll get" preview and the ledger row written on confirmation
 * are computed by the same code and cannot disagree.
 *
 * It never runs in the browser: the preview is rendered on the server and the
 * award is recomputed server-side at confirmation time from the station and
 * booster rows, so a tampered client can at most lie to itself.
 */

/**
 * numeric(10,2) in Postgres, so anything finer than a cent-equivalent would be
 * silently rounded on write. Rounding here keeps the preview honest about what
 * will actually be stored.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function scoreStation(
  station: { basePoints: number; categoryId: number },
  booster: Pick<Booster, "name" | "categoryId" | "bonusPercent"> | null
): ScoreBreakdown {
  const basePoints = round2(station.basePoints);

  // The bonus is earned by category match alone — the booster's percentage is
  // whatever the operator configured on that booster, never a constant here.
  const boosterApplied = Boolean(booster && booster.categoryId === station.categoryId);

  if (!booster || !boosterApplied) {
    return {
      basePoints,
      boosterApplied: false,
      boosterName: booster?.name ?? "",
      bonusPercent: booster?.bonusPercent ?? 0,
      bonusPoints: 0,
      totalPoints: basePoints,
    };
  }

  const bonusPoints = round2((basePoints * booster.bonusPercent) / 100);

  return {
    basePoints,
    boosterApplied: true,
    boosterName: booster.name,
    bonusPercent: booster.bonusPercent,
    bonusPoints,
    totalPoints: round2(basePoints + bonusPoints),
  };
}
