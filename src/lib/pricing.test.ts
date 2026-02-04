import { describe, it, expect } from 'vitest';
import { calculateBookingPrice, hasPriceVariation, PriceBreakdown } from './pricing';

describe('calculateBookingPrice', () => {
  const baseProperty = {
    pricePerNight: 200,
    baseGuests: 2,
    extraGuestPrice: 50,
    periodPricings: [],
  };

  describe('basic price calculation', () => {
    it('calculates price for single night stay', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        guests: 2,
      });

      expect(result.nights).toBe(1);
      expect(result.basePrice).toBe(200);
      expect(result.extraGuestFee).toBe(0);
      expect(result.totalPrice).toBe(200);
      expect(result.nightlyPrices).toHaveLength(1);
      expect(result.nightlyPrices[0].price).toBe(200);
    });

    it('calculates price for multiple night stay', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-04',
        guests: 2,
      });

      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(600);
      expect(result.totalPrice).toBe(600);
      expect(result.nightlyPrices).toHaveLength(3);
    });

    it('returns zero values for invalid date range (end before start)', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-05',
        endDate: '2025-06-01',
        guests: 2,
      });

      expect(result.nights).toBe(0);
      expect(result.basePrice).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.nightlyPrices).toHaveLength(0);
    });

    it('returns zero values for same day check-in/check-out', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-01',
        guests: 2,
      });

      expect(result.nights).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('extra guest pricing', () => {
    it('charges extra for guests exceeding baseGuests', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-04',
        guests: 4,
      });

      expect(result.nights).toBe(3);
      expect(result.extraGuests).toBe(2);
      expect(result.extraGuestFee).toBe(300); // 2 extra guests x 3 nights x 50 RON
      expect(result.basePrice).toBe(600);
      expect(result.totalPrice).toBe(900);
    });

    it('does not charge extra when guests equal baseGuests', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-03',
        guests: 2,
      });

      expect(result.extraGuests).toBe(0);
      expect(result.extraGuestFee).toBe(0);
    });

    it('does not charge extra when guests less than baseGuests', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-03',
        guests: 1,
      });

      expect(result.extraGuests).toBe(0);
      expect(result.extraGuestFee).toBe(0);
    });

    it('handles baseGuests of 0 (no extra guest fees)', () => {
      const propertyNoExtraFee = {
        ...baseProperty,
        baseGuests: 0,
      };

      const result = calculateBookingPrice({
        property: propertyNoExtraFee,
        startDate: '2025-06-01',
        endDate: '2025-06-03',
        guests: 10,
      });

      expect(result.extraGuests).toBe(0);
      expect(result.extraGuestFee).toBe(0);
    });
  });

  describe('period pricing', () => {
    it('applies period pricing when dates fall within range', () => {
      const propertyWithPeriod = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Summer Sale',
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            pricePerNight: 150,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithPeriod,
        startDate: '2025-06-05',
        endDate: '2025-06-08',
        guests: 2,
      });

      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(450); // 3 nights x 150 RON
      expect(result.normalPrice).toBe(600); // What it would cost at default price
      expect(result.savings).toBe(150); // 600 - 450
      expect(result.nightlyPrices.every(n => n.price === 150)).toBe(true);
      expect(result.nightlyPrices.every(n => n.periodName === 'Summer Sale')).toBe(true);
    });

    it('applies higher period pricing when dates are more expensive', () => {
      const propertyWithExpensivePeriod = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Holiday Peak',
            startDate: '2025-12-20',
            endDate: '2025-12-31',
            pricePerNight: 350,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithExpensivePeriod,
        startDate: '2025-12-24',
        endDate: '2025-12-27',
        guests: 2,
      });

      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(1050); // 3 nights x 350 RON
      expect(result.normalPrice).toBe(600); // 3 nights x 200 RON
      expect(result.savings).toBe(-450); // User pays more, negative savings
    });

    it('uses default price for dates outside period', () => {
      const propertyWithPeriod = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Summer Sale',
            startDate: '2025-07-01',
            endDate: '2025-07-31',
            pricePerNight: 150,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithPeriod,
        startDate: '2025-06-05',
        endDate: '2025-06-08',
        guests: 2,
      });

      expect(result.basePrice).toBe(600); // Default price: 3 x 200
      expect(result.savings).toBe(0);
      expect(result.nightlyPrices.every(n => n.periodName === undefined)).toBe(true);
    });

    it('handles partial overlap with period pricing', () => {
      const propertyWithPeriod = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Weekend Special',
            startDate: '2025-06-07',
            endDate: '2025-06-08',
            pricePerNight: 180,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithPeriod,
        startDate: '2025-06-05',
        endDate: '2025-06-10',
        guests: 2,
      });

      // 5 nights: June 5, 6 (default), June 7, 8 (period), June 9 (default)
      expect(result.nights).toBe(5);

      // Default: 3 nights x 200 = 600
      // Period: 2 nights x 180 = 360
      // Total: 960
      expect(result.basePrice).toBe(960);
      expect(result.normalPrice).toBe(1000); // 5 x 200
      expect(result.savings).toBe(40); // 1000 - 960

      // Check individual nights
      const periodNights = result.nightlyPrices.filter(n => n.periodName === 'Weekend Special');
      expect(periodNights).toHaveLength(2);
    });

    it('uses highest price when periods overlap', () => {
      const propertyWithOverlappingPeriods = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Summer Sale',
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            pricePerNight: 180,
          },
          {
            id: '2',
            name: 'Peak Weekend',
            startDate: '2025-06-14',
            endDate: '2025-06-16',
            pricePerNight: 250,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithOverlappingPeriods,
        startDate: '2025-06-14',
        endDate: '2025-06-17',
        guests: 2,
      });

      // All 3 nights fall within both periods, should use highest (250)
      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(750); // 3 x 250
      expect(result.nightlyPrices.every(n => n.price === 250)).toBe(true);
      expect(result.nightlyPrices.every(n => n.periodName === 'Peak Weekend')).toBe(true);
    });

    it('combines period pricing with extra guest fees', () => {
      const propertyWithPeriod = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Summer Sale',
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            pricePerNight: 150,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithPeriod,
        startDate: '2025-06-05',
        endDate: '2025-06-08',
        guests: 4,
      });

      expect(result.nights).toBe(3);
      expect(result.basePrice).toBe(450); // 3 nights x 150 RON
      expect(result.extraGuests).toBe(2);
      expect(result.extraGuestFee).toBe(300); // 2 extra x 3 nights x 50 RON
      expect(result.totalPrice).toBe(750); // 450 + 300
    });
  });

  describe('savings calculation', () => {
    it('shows positive savings for discounted periods', () => {
      const propertyWithDiscount = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'Early Bird',
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            pricePerNight: 150,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithDiscount,
        startDate: '2025-06-10',
        endDate: '2025-06-15',
        guests: 2,
      });

      expect(result.normalPrice).toBe(1000); // 5 nights x 200
      expect(result.basePrice).toBe(750); // 5 nights x 150
      expect(result.savings).toBe(250); // Positive = saved money
    });

    it('shows negative savings for premium periods', () => {
      const propertyWithPremium = {
        ...baseProperty,
        periodPricings: [
          {
            id: '1',
            name: 'New Year',
            startDate: '2025-12-30',
            endDate: '2026-01-02',
            pricePerNight: 400,
          },
        ],
      };

      const result = calculateBookingPrice({
        property: propertyWithPremium,
        startDate: '2025-12-31',
        endDate: '2026-01-02',
        guests: 2,
      });

      expect(result.normalPrice).toBe(400); // 2 nights x 200
      expect(result.basePrice).toBe(800); // 2 nights x 400
      expect(result.savings).toBe(-400); // Negative = paid more
    });

    it('shows zero savings when no period pricing applies', () => {
      const result = calculateBookingPrice({
        property: baseProperty,
        startDate: '2025-06-01',
        endDate: '2025-06-04',
        guests: 2,
      });

      expect(result.normalPrice).toBe(600);
      expect(result.basePrice).toBe(600);
      expect(result.savings).toBe(0);
    });
  });
});

describe('hasPriceVariation', () => {
  it('returns false for single night', () => {
    const breakdown: PriceBreakdown = {
      nightlyPrices: [{ date: '2025-06-01', price: 200 }],
      basePrice: 200,
      extraGuestFee: 0,
      totalPrice: 200,
      nights: 1,
      extraGuests: 0,
      normalPrice: 200,
      savings: 0,
    };

    expect(hasPriceVariation(breakdown)).toBe(false);
  });

  it('returns false when all nights have same price', () => {
    const breakdown: PriceBreakdown = {
      nightlyPrices: [
        { date: '2025-06-01', price: 200 },
        { date: '2025-06-02', price: 200 },
        { date: '2025-06-03', price: 200 },
      ],
      basePrice: 600,
      extraGuestFee: 0,
      totalPrice: 600,
      nights: 3,
      extraGuests: 0,
      normalPrice: 600,
      savings: 0,
    };

    expect(hasPriceVariation(breakdown)).toBe(false);
  });

  it('returns true when nights have different prices', () => {
    const breakdown: PriceBreakdown = {
      nightlyPrices: [
        { date: '2025-06-01', price: 200 },
        { date: '2025-06-02', price: 250, periodName: 'Weekend' },
        { date: '2025-06-03', price: 200 },
      ],
      basePrice: 650,
      extraGuestFee: 0,
      totalPrice: 650,
      nights: 3,
      extraGuests: 0,
      normalPrice: 600,
      savings: -50,
    };

    expect(hasPriceVariation(breakdown)).toBe(true);
  });

  it('returns false for empty nightlyPrices', () => {
    const breakdown: PriceBreakdown = {
      nightlyPrices: [],
      basePrice: 0,
      extraGuestFee: 0,
      totalPrice: 0,
      nights: 0,
      extraGuests: 0,
      normalPrice: 0,
      savings: 0,
    };

    expect(hasPriceVariation(breakdown)).toBe(false);
  });
});

