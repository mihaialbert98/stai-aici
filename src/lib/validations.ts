import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Minim 6 caractere'),
  name: z.string().min(2, 'Minim 2 caractere'),
  role: z.enum(['GUEST', 'HOST']).default('GUEST'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Introduceți parola'),
});

export const propertySchema = z.object({
  title: z.string().min(5, 'Minim 5 caractere'),
  description: z.string().min(20, 'Minim 20 caractere'),
  city: z.string().min(2, 'Introduceți orașul'),
  address: z.string().min(5, 'Introduceți adresa'),
  pricePerNight: z.number().min(1, 'Prețul trebuie să fie pozitiv'),
  maxGuests: z.number().int().min(1, 'Minim 1 oaspete'),
  checkInInfo: z.string().optional(),
  houseRules: z.string().optional(),
  localTips: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const bookingSchema = z.object({
  propertyId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  guests: z.number().int().min(1),
});

export const messageSchema = z.object({
  bookingId: z.string(),
  content: z.string().min(1, 'Mesajul nu poate fi gol'),
});
