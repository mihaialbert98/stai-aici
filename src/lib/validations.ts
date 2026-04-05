import { z } from 'zod';
import { sanitizeText } from './sanitize';

const cleanStr = (min: number, msg: string) =>
  z.string().min(min, msg).transform(sanitizeText);

export const registerSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Minim 6 caractere'),
  name: cleanStr(2, 'Minim 2 caractere'),
  role: z.enum(['GUEST', 'HOST']).default('GUEST'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Introduceți parola'),
});

export const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'CABIN', 'VILLA', 'STUDIO', 'ROOM', 'PENSION', 'OTHER'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  CABIN: 'Cabana',
  VILLA: 'Vila',
  STUDIO: 'Garsoniera',
  ROOM: 'Camera',
  PENSION: 'Pensiune',
  OTHER: 'Altele',
};

// Minimal schema used when first creating a property (title + optional image)
export const createPropertySchema = z.object({
  title: cleanStr(2, 'Minim 2 caractere'),
  imageUrls: z.array(z.string().url()).optional(),
});

export const propertySchema = z.object({
  title: cleanStr(5, 'Minim 5 caractere'),
  description: z.union([z.string().min(20, 'Minim 20 caractere'), z.literal('')]).optional().transform(v => v ? sanitizeText(v) : v),
  city: cleanStr(2, 'Introduceți orașul').optional(),
  address: cleanStr(5, 'Introduceți adresa').optional(),
  pricePerNight: z.number().min(1, 'Prețul trebuie să fie pozitiv').optional(),
  maxGuests: z.number().int().min(1, 'Minim 1 oaspete').optional(),
  baseGuests: z.number().int().min(0).optional(),
  extraGuestPrice: z.number().min(0).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  checkInInfo: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  houseRules: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  localTips: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  locationMapUrl: z.string().url().optional().nullable()
    .refine(
      (url) => {
        if (!url) return true;
        try {
          const { protocol, hostname } = new URL(url);
          if (protocol !== 'https:') return false;
          const h = hostname.toLowerCase();
          return h === 'www.google.com' || h === 'google.com' || h === 'maps.google.com' || h === 'maps.app.goo.gl' || h === 'goo.gl';
        } catch { return false; }
      },
      { message: 'Must be a valid Google Maps HTTPS link' }
    ),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
  amenityIds: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

export const periodPricingSchema = z.object({
  id: z.string().optional(),
  name: cleanStr(2, 'Minim 2 caractere'),
  startDate: z.string(),
  endDate: z.string(),
  pricePerNight: z.number().min(1, 'Prețul trebuie să fie pozitiv'),
});

export const bookingSchema = z.object({
  propertyId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  guests: z.number().int().min(1),
});

export const messageSchema = z.object({
  bookingId: z.string(),
  content: cleanStr(1, 'Mesajul nu poate fi gol'),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().transform(v => v ? sanitizeText(v) : v),
});
