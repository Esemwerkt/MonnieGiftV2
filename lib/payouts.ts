
export interface PayoutEstimate {
  grossAmount: number;
  stripeFee: number;
  platformFee: number;
  netAmount: number;
  stripeFeePercentage: number;
  platformFeePercentage: number;
  currency: string;
}

export function calculatePayoutEstimate(amount: number, currency: string = 'eur', subscriptionPlan: string = 'free'): PayoutEstimate {
  
  const stripeFeePercentage = 0.029; // 2.9%
  
  let platformFeePercentage = 0.005; 
  switch (subscriptionPlan) {
    case 'pro':
      platformFeePercentage = 0.003; // 0.3%
      break;
    case 'business':
      platformFeePercentage = 0.001; // 0.1%
      break;
    default:
      platformFeePercentage = 0.005; // 0.5%
  }
  
  const fixedFee = currency === 'eur' ? 30 : currency === 'usd' ? 30 : 20; 
  
  const grossAmount = amount;
  const stripeFee = Math.round(grossAmount * stripeFeePercentage + fixedFee);
  const platformFee = Math.round(grossAmount * platformFeePercentage);
  const totalFees = stripeFee + platformFee;
  const netAmount = grossAmount - totalFees;
  
  return {
    grossAmount,
    stripeFee,
    platformFee,
    netAmount,
    stripeFeePercentage: stripeFeePercentage * 100,
    platformFeePercentage: platformFeePercentage * 100,
    currency: currency.toUpperCase(),
  };
}

export function formatPayoutEstimate(estimate: PayoutEstimate): string {
  const gross = (estimate.grossAmount / 100).toFixed(2);
  const net = (estimate.netAmount / 100).toFixed(2);
  const stripeFee = (estimate.stripeFee / 100).toFixed(2);
  const platformFee = (estimate.platformFee / 100).toFixed(2);
  const totalFees = ((estimate.stripeFee + estimate.platformFee) / 100).toFixed(2);
  
  return `${estimate.currency} ${net} (${estimate.currency} ${totalFees} fees)`;
}

export function getPayoutScheduleText(schedule: any): string {
  if (!schedule) return 'Not configured';
  
  if (schedule.interval === 'daily') {
    return 'Daily payouts';
  } else if (schedule.interval === 'weekly') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Weekly payouts (${days[schedule.weeklyAnchor]})`;
  } else if (schedule.interval === 'monthly') {
    return `Monthly payouts (day ${schedule.monthlyAnchor})`;
  }
  
  return 'Custom schedule';
}
