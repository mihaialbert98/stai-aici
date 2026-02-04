import { eachDayOfInterval, format, isWithinInterval, startOfDay } from 'date-fns';

export interface PeriodPricing {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  pricePerNight: number;
}

export interface PriceCalculationInput {
  property: {
    pricePerNight: number;
    baseGuests: number;
    extraGuestPrice: number;
    periodPricings?: PeriodPricing[];
  };
  startDate: Date | string;
  endDate: Date | string;
  guests: number;
}

export interface NightlyPrice {
  date: string;
  price: number;
  periodName?: string;
}

export interface PriceBreakdown {
  nightlyPrices: NightlyPrice[];
  basePrice: number;
  extraGuestFee: number;
  totalPrice: number;
  nights: number;
  extraGuests: number;
  normalPrice: number; // What it would cost without period pricing
  savings: number; // Positive = saved money, negative = paid more
}

/**
 * Calculate booking price with period pricing and extra guest fees
 */
export function calculateBookingPrice(input: PriceCalculationInput): PriceBreakdown {
  const { property, guests } = input;
  const startDate = startOfDay(new Date(input.startDate));
  const endDate = startOfDay(new Date(input.endDate));

  // Get all nights (excluding last day - checkout)
  const lastNight = new Date(endDate);
  lastNight.setDate(lastNight.getDate() - 1);

  if (lastNight < startDate) {
    return {
      nightlyPrices: [],
      basePrice: 0,
      extraGuestFee: 0,
      totalPrice: 0,
      nights: 0,
      extraGuests: 0,
      normalPrice: 0,
      savings: 0,
    };
  }

  const nights = eachDayOfInterval({ start: startDate, end: lastNight });
  const periodPricings = property.periodPricings || [];

  // Calculate price for each night
  const nightlyPrices: NightlyPrice[] = nights.map(night => {
    // Find all applicable period pricings for this night
    const matchingPeriods: PeriodPricing[] = [];

    for (const period of periodPricings) {
      const periodStart = startOfDay(new Date(period.startDate));
      const periodEnd = startOfDay(new Date(period.endDate));

      if (isWithinInterval(night, { start: periodStart, end: periodEnd })) {
        matchingPeriods.push(period);
      }
    }

    // If there are matching periods, use the highest priced one (for overlapping periods)
    // This ensures period pricing is always applied when within range
    if (matchingPeriods.length > 0) {
      const bestPeriod = matchingPeriods.reduce((best, p) =>
        p.pricePerNight > best.pricePerNight ? p : best
      );
      return {
        date: format(night, 'yyyy-MM-dd'),
        price: bestPeriod.pricePerNight,
        periodName: bestPeriod.name,
      };
    }

    // No period pricing applies - use default
    return {
      date: format(night, 'yyyy-MM-dd'),
      price: property.pricePerNight,
    };
  });

  const basePrice = nightlyPrices.reduce((sum, n) => sum + n.price, 0);
  const normalPrice = nights.length * property.pricePerNight; // What it would cost at default price
  const savings = normalPrice - basePrice; // Positive = saved, negative = paid more

  // Calculate extra guest fee
  let extraGuests = 0;
  let extraGuestFee = 0;

  if (property.baseGuests > 0 && guests > property.baseGuests) {
    extraGuests = guests - property.baseGuests;
    extraGuestFee = extraGuests * property.extraGuestPrice * nights.length;
  }

  return {
    nightlyPrices,
    basePrice,
    extraGuestFee,
    totalPrice: basePrice + extraGuestFee,
    nights: nights.length,
    extraGuests,
    normalPrice,
    savings,
  };
}

/**
 * Check if prices vary across nights (for UI display decisions)
 */
export function hasPriceVariation(breakdown: PriceBreakdown): boolean {
  if (breakdown.nightlyPrices.length <= 1) return false;
  const firstPrice = breakdown.nightlyPrices[0].price;
  return breakdown.nightlyPrices.some(n => n.price !== firstPrice);
}
