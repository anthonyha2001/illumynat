import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data/settings";

export type LoyaltyTierType = "BRONZE" | "SILVER" | "GOLD";

function calcTier(lifetimePoints: number): LoyaltyTierType {
  if (lifetimePoints >= 2000) return "GOLD";
  if (lifetimePoints >= 500)  return "SILVER";
  return "BRONZE";
}

/** Ensure a loyalty account exists for a profile, creating it if needed. */
async function ensureAccount(profileId: string) {
  return prisma.loyaltyAccount.upsert({
    where:  { profileId },
    update: {},
    create: { profileId, totalPoints: 0, lifetimePoints: 0, tier: "BRONZE" },
  });
}

/** Award points to a profile. Returns the updated account. */
export async function awardPoints(
  profileId: string,
  points: number,
  type: "EARNED_SIGNUP" | "EARNED_PURCHASE" | "EARNED_REVIEW" | "ADJUSTED",
  description: string,
  orderId?: string
) {
  const account = await ensureAccount(profileId);
  const newTotal    = account.totalPoints    + points;
  const newLifetime = account.lifetimePoints + points;
  const newTier     = calcTier(newLifetime);

  return prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { profileId },
      data: {
        totalPoints:    newTotal,
        lifetimePoints: newLifetime,
        tier:           newTier,
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId:   account.id,
        points,
        type,
        description,
        orderId: orderId ?? null,
      },
    }),
  ]);
}

/** Award signup bonus. Call once after profile creation. */
export async function awardSignupBonus(profileId: string) {
  const settings = await getSettings();
  if (settings.POINTS_SIGNUP_BONUS <= 0) return;
  return awardPoints(
    profileId,
    settings.POINTS_SIGNUP_BONUS,
    "EARNED_SIGNUP",
    `Welcome bonus — ${settings.POINTS_SIGNUP_BONUS} points`
  );
}

/** Award purchase points. Call after order is marked PAID. */
export async function awardPurchasePoints(profileId: string, orderTotal: number, orderId: string) {
  const settings = await getSettings();
  const points = Math.floor(orderTotal * settings.POINTS_PER_DOLLAR);
  if (points <= 0) return;
  return awardPoints(
    profileId,
    points,
    "EARNED_PURCHASE",
    `Earned ${points} points on order`,
    orderId
  );
}

/** Award review bonus. Call after admin approves a review. */
export async function awardReviewPoints(profileId: string) {
  const settings = await getSettings();
  if (settings.POINTS_REVIEW_BONUS <= 0) return;
  return awardPoints(
    profileId,
    settings.POINTS_REVIEW_BONUS,
    "EARNED_REVIEW",
    `Review approved — ${settings.POINTS_REVIEW_BONUS} points`
  );
}

/** Manual admin adjustment. points can be negative (deduction). */
export async function adjustPoints(profileId: string, points: number, description: string) {
  const account = await ensureAccount(profileId);
  const newTotal    = Math.max(0, account.totalPoints + points);
  const newLifetime = points > 0 ? account.lifetimePoints + points : account.lifetimePoints;
  const newTier     = calcTier(newLifetime);

  return prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { profileId },
      data: { totalPoints: newTotal, lifetimePoints: newLifetime, tier: newTier },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId:   account.id,
        points,
        type:        "ADJUSTED",
        description,
      },
    }),
  ]);
}

export const TIER_LABELS: Record<LoyaltyTierType, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD:   "Gold",
};

export const TIER_NEXT: Record<LoyaltyTierType, number | null> = {
  BRONZE: 500,
  SILVER: 2000,
  GOLD:   null,
};
