import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  propertySchema,
  bookingSchema,
  messageSchema,
  reviewSchema,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from '../validations';

describe('registerSchema', () => {
  it('validates correct registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
      role: 'GUEST',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('defaults role to GUEST', () => {
    const result = registerSchema.parse({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.role).toBe('GUEST');
  });

  it('only accepts GUEST or HOST roles', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes name field', () => {
    const result = registerSchema.parse({
      email: 'test@example.com',
      password: 'password123',
      name: '<script>alert("xss")</script>John',
    });
    expect(result.name).toBe('John');
  });
});

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('propertySchema', () => {
  const validProperty = {
    title: 'Beautiful Apartment',
    description: 'A lovely apartment in the city center with great views',
    city: 'București',
    address: 'Strada Victoriei 123',
    pricePerNight: 150,
    maxGuests: 4,
  };

  it('validates correct property data', () => {
    const result = propertySchema.safeParse(validProperty);
    expect(result.success).toBe(true);
  });

  it('rejects short title', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      title: 'Hi',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short description', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      description: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive price', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      pricePerNight: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive maxGuests', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      maxGuests: 0,
    });
    expect(result.success).toBe(false);
  });

  it('validates property types', () => {
    for (const type of PROPERTY_TYPES) {
      const result = propertySchema.safeParse({
        ...validProperty,
        propertyType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid property type', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      propertyType: 'CASTLE',
    });
    expect(result.success).toBe(false);
  });

  it('validates cancellation policies', () => {
    for (const policy of ['FLEXIBLE', 'MODERATE', 'STRICT'] as const) {
      const result = propertySchema.safeParse({
        ...validProperty,
        cancellationPolicy: policy,
      });
      expect(result.success).toBe(true);
    }
  });

  it('sanitizes text fields', () => {
    const result = propertySchema.parse({
      ...validProperty,
      title: '<b>Malicious</b> Title',
      description: '<script>evil()</script>A lovely apartment in the city center',
    });
    expect(result.title).toBe('Malicious Title');
    expect(result.description).toBe('A lovely apartment in the city center');
  });

  it('validates image URLs', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      imageUrls: ['https://example.com/img.jpg', 'https://cdn.example.com/photo.png'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid image URLs', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      imageUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });
});

describe('bookingSchema', () => {
  it('validates correct booking data', () => {
    const result = bookingSchema.safeParse({
      propertyId: 'prop-123',
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      guests: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing propertyId', () => {
    const result = bookingSchema.safeParse({
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      guests: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero guests', () => {
    const result = bookingSchema.safeParse({
      propertyId: 'prop-123',
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      guests: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('messageSchema', () => {
  it('validates correct message data', () => {
    const result = messageSchema.safeParse({
      bookingId: 'booking-123',
      content: 'Hello, I have a question',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = messageSchema.safeParse({
      bookingId: 'booking-123',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes content', () => {
    const result = messageSchema.parse({
      bookingId: 'booking-123',
      content: '<script>xss</script>Hello',
    });
    expect(result.content).toBe('Hello');
  });
});

describe('reviewSchema', () => {
  it('validates correct review data', () => {
    const result = reviewSchema.safeParse({
      bookingId: 'booking-123',
      rating: 5,
      comment: 'Great stay!',
    });
    expect(result.success).toBe(true);
  });

  it('allows missing comment', () => {
    const result = reviewSchema.safeParse({
      bookingId: 'booking-123',
      rating: 4,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = reviewSchema.safeParse({
      bookingId: 'booking-123',
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects rating above 5', () => {
    const result = reviewSchema.safeParse({
      bookingId: 'booking-123',
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer ratings', () => {
    const result = reviewSchema.safeParse({
      bookingId: 'booking-123',
      rating: 4.5,
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes comment', () => {
    const result = reviewSchema.parse({
      bookingId: 'booking-123',
      rating: 5,
      comment: '<a href="spam">Click</a>Great!',
    });
    expect(result.comment).toBe('ClickGreat!');
  });
});

describe('PROPERTY_TYPE_LABELS', () => {
  it('has labels for all property types', () => {
    for (const type of PROPERTY_TYPES) {
      expect(PROPERTY_TYPE_LABELS[type]).toBeDefined();
      expect(typeof PROPERTY_TYPE_LABELS[type]).toBe('string');
    }
  });
});
