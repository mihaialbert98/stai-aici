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

export const propertySchema = z.object({
  title: cleanStr(5, 'Minim 5 caractere'),
  description: cleanStr(20, 'Minim 20 caractere'),
  city: cleanStr(2, 'Introduceți orașul'),
  address: cleanStr(5, 'Introduceți adresa'),
  pricePerNight: z.number().min(1, 'Prețul trebuie să fie pozitiv'),
  maxGuests: z.number().int().min(1, 'Minim 1 oaspete'),
  baseGuests: z.number().int().min(0).optional(),
  extraGuestPrice: z.number().min(0).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  checkInInfo: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  houseRules: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  localTips: z.string().optional().transform(v => v ? sanitizeText(v) : v),
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
