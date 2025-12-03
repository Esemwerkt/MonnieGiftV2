import { supabaseAdmin } from '@/lib/supabase';

export const LIMITS = {
  MIN_GIFT_AMOUNT: 100, // €1.00
  MAX_GIFT_AMOUNT: 5000, // €50.00 (per playbook)
  MAX_DAILY_GIFTS: 10, // 10 gifts per day
  MAX_MONTHLY_AMOUNT: 100000, // €1000.00 per month
  MAX_MONTHLY_GIFTS: 10, // 10 gifts per month
} as const;

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentAmount: number;
  currentGiftCount: number;
  remainingAmount: number;
  remainingGifts: number;
}

export async function checkUserLimits(
  stripeAccountId: string,
  giftAmount: number
): Promise<LimitCheckResult> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .or(`stripeConnectAccountId.eq.${stripeAccountId},stripeConnectAccountId.eq.${stripeAccountId.startsWith('acct_') ? stripeAccountId : `acct_${stripeAccountId}`}`)
    .limit(1);
  
  const user = users?.[0];

  if (!user) {
    return {
      allowed: true,
      currentAmount: 0,
      currentGiftCount: 0,
      remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT,
      remainingGifts: LIMITS.MAX_MONTHLY_GIFTS,
    };
  }

  const { data: userLimitsData } = await supabaseAdmin
    .from('user_limits')
    .select('*')
    .eq('userId', user.id)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single();

  let userLimits = userLimitsData;

  if (!userLimits) {
    const { data: newUserLimits } = await supabaseAdmin
      .from('user_limits')
      .insert({
        userId: user.id,
        month: currentMonth,
        year: currentYear,
        totalAmount: 0,
        giftCount: 0,
      })
      .select()
      .single();
    
    userLimits = newUserLimits;
  }

  const newTotalAmount = userLimits.totalAmount + giftAmount;
  const newGiftCount = userLimits.giftCount + 1;

  if (giftAmount < LIMITS.MIN_GIFT_AMOUNT) {
    return {
      allowed: false,
      reason: `Minimum cadeau bedrag is €${LIMITS.MIN_GIFT_AMOUNT / 100}`,
      currentAmount: userLimits.totalAmount,
      currentGiftCount: userLimits.giftCount,
      remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT - userLimits.totalAmount,
      remainingGifts: LIMITS.MAX_MONTHLY_GIFTS - userLimits.giftCount,
    };
  }

  if (giftAmount > LIMITS.MAX_GIFT_AMOUNT) {
    return {
      allowed: false,
      reason: `Maximum cadeau bedrag is €${LIMITS.MAX_GIFT_AMOUNT / 100}`,
      currentAmount: userLimits.totalAmount,
      currentGiftCount: userLimits.giftCount,
      remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT - userLimits.totalAmount,
      remainingGifts: LIMITS.MAX_MONTHLY_GIFTS - userLimits.giftCount,
    };
  }

  if (newTotalAmount > LIMITS.MAX_MONTHLY_AMOUNT) {
    const remainingAmount = LIMITS.MAX_MONTHLY_AMOUNT - userLimits.totalAmount;
    const reason = remainingAmount > 0 
      ? `Maandelijkse limiet overschreden. Je kunt nog €${remainingAmount / 100} ontvangen deze maand.`
      : `Maandelijkse limiet van €${LIMITS.MAX_MONTHLY_AMOUNT / 100} is overschreden. Je kunt deze maand geen cadeaus meer ontvangen.`;
    
    return {
      allowed: false,
      reason,
      currentAmount: userLimits.totalAmount,
      currentGiftCount: userLimits.giftCount,
      remainingAmount: Math.max(0, remainingAmount),
      remainingGifts: LIMITS.MAX_MONTHLY_GIFTS - userLimits.giftCount,
    };
  }

  if (newGiftCount > LIMITS.MAX_MONTHLY_GIFTS) {
    const remainingGifts = LIMITS.MAX_MONTHLY_GIFTS - userLimits.giftCount;
    const reason = remainingGifts > 0 
      ? `Maandelijkse cadeau limiet overschreden. Je kunt nog ${remainingGifts} cadeaus ontvangen deze maand.`
      : `Maandelijkse cadeau limiet van ${LIMITS.MAX_MONTHLY_GIFTS} is overschreden. Je kunt deze maand geen cadeaus meer ontvangen.`;
    
    return {
      allowed: false,
      reason,
      currentAmount: userLimits.totalAmount,
      currentGiftCount: userLimits.giftCount,
      remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT - userLimits.totalAmount,
      remainingGifts: Math.max(0, remainingGifts),
    };
  }

  return {
    allowed: true,
    currentAmount: userLimits.totalAmount,
    currentGiftCount: userLimits.giftCount,
    remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT - newTotalAmount,
    remainingGifts: LIMITS.MAX_MONTHLY_GIFTS - newGiftCount,
  };
}

export async function updateUserLimits(
  stripeAccountId: string,
  giftAmount: number
): Promise<void> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripeConnectAccountId', stripeAccountId)
    .single();

  if (!user) {
    throw new Error(`User not found for Stripe account: ${stripeAccountId}`);
  }

  // Check if user limits exist for this month/year
  const { data: existingLimits } = await supabaseAdmin
    .from('user_limits')
    .select('*')
    .eq('userId', user.id)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single();

  if (existingLimits) {
    // Update existing limits
    await supabaseAdmin
      .from('user_limits')
      .update({
        totalAmount: existingLimits.totalAmount + giftAmount,
        giftCount: existingLimits.giftCount + 1,
      })
      .eq('id', existingLimits.id);
  } else {
    // Create new limits
    await supabaseAdmin
      .from('user_limits')
      .insert({
        userId: user.id,
        month: currentMonth,
        year: currentYear,
        totalAmount: giftAmount,
        giftCount: 1,
      });
  }
}

export async function getUserLimits(stripeAccountId: string) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripeConnectAccountId', stripeAccountId)
    .single();

  if (!user) {
    return {
      currentAmount: 0,
      currentGiftCount: 0,
      remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT,
      remainingGifts: LIMITS.MAX_MONTHLY_GIFTS,
      monthlyLimit: LIMITS.MAX_MONTHLY_AMOUNT,
      monthlyGiftLimit: LIMITS.MAX_MONTHLY_GIFTS,
    };
  }

  const { data: userLimits } = await supabaseAdmin
    .from('user_limits')
    .select('*')
    .eq('userId', user.id)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single();

  const currentAmount = userLimits?.totalAmount || 0;
  const currentGiftCount = userLimits?.giftCount || 0;

  return {
    currentAmount,
    currentGiftCount,
    remainingAmount: LIMITS.MAX_MONTHLY_AMOUNT - currentAmount,
    remainingGifts: LIMITS.MAX_MONTHLY_GIFTS - currentGiftCount,
    monthlyLimit: LIMITS.MAX_MONTHLY_AMOUNT,
    monthlyGiftLimit: LIMITS.MAX_MONTHLY_GIFTS,
  };
}
