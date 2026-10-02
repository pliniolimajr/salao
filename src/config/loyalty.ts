export const LOYALTY_REWARD_POINTS = 250;
export const LOYALTY_POINTS_PER_APPOINTMENT = 10;

export function loyaltyProgress(points: number): number {
  return Math.min((Math.max(points, 0) / LOYALTY_REWARD_POINTS) * 100, 100);
}
