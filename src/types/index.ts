// src/types/index.ts
// Central type definitions — import from here instead of defining inline in pages

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type UserRole = 'GUEST' | 'HOST' | 'ADMIN';

export interface PropertySummary {
  id: string;
  title: string;
}

export interface BookingData {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  guests: number;
  guest: { id: string; name: string; email: string };
  property: { id: string; title: string; images: { url: string }[] };
}

export interface ManualReservationData {
  id: string;
  propertyId: string;
  guestName: string | null;
  checkIn: string;
  checkOut: string;
  revenue: number;
  source: string | null;
  notes: string | null;
  blockCalendar: boolean;
}

export interface SyncedReservationData {
  id: string;
  propertyId: string;
  source: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  revenue: number;
  notes: string | null;
  isBlock: boolean;
  isBlockManual: boolean | null;
  summary: string | null;
}

export interface Reservation {
  id: string;
  type: 'platform' | 'manual' | 'synced';
  propertyId: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  revenue: number;
  source: string | null;
  status: string;
  notes: string | null;
  bookingId: string | null;
  blockCalendar?: boolean;
  isBlockManual?: boolean | null;
  color?: string;
}

export interface PeriodPricing {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
}

export interface CalendarSync {
  id: string;
  platform: string;
  icalUrl: string;
  color: string | null;
  lastSynced: string | null;
}

export interface Task {
  id: string;
  propertyId: string;
  title: string;
  done: boolean;
  createdAt: string;
}
