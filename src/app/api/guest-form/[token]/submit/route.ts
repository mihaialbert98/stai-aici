import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addYears } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { generateRegistrationDoc, generateFileName } from '@/lib/word-generator';
import { sendGuestFormsSubmittedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Max sizes: 500 chars for text fields, 500KB for base64 signature image
const MAX_TEXT = 500;
const MAX_SIGNATURE_BYTES = 500_000;

const singleSchema = z.object({
  lastName:        z.string().min(1).max(MAX_TEXT),
  firstName:       z.string().min(1).max(MAX_TEXT),
  dateOfBirth:     z.string().min(1).max(MAX_TEXT),
  citizenship:     z.string().min(1).max(MAX_TEXT),
  placeOfBirth:    z.string().max(MAX_TEXT).default(''),
  city:            z.string().max(MAX_TEXT).default(''),
  street:          z.string().max(MAX_TEXT).default(''),
  streetNumber:    z.string().max(MAX_TEXT).default(''),
  country:         z.string().max(MAX_TEXT).default(''),
  purposeOfTravel: z.string().max(MAX_TEXT).default(''),
  documentType:    z.string().min(1).max(MAX_TEXT),
  idSeries:        z.string().max(MAX_TEXT).default(''),
  idNumber:        z.string().min(1).max(MAX_TEXT),
  checkInDate:     z.string().min(1).max(20).refine(d => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date >= today;
  }, { message: 'Check-in date cannot be in the past' }),
  checkOutDate:    z.string().min(1).max(20),
  numberOfGuests:  z.number().int().min(1).max(100),
  gdprConsent:     z.literal(true),
  touristSignature: z.string().max(MAX_SIGNATURE_BYTES).default(''),
}).superRefine((data, ctx) => {
  const ci = new Date(data.checkInDate);
  const co = new Date(data.checkOutDate);
  if (!isNaN(ci.getTime()) && !isNaN(co.getTime()) && co <= ci) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Check-out must be after check-in',
      path: ['checkOutDate'],
    });
  }
});

const bodySchema = z.array(singleSchema).min(1).max(20);

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const limited = rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, prefix: 'guest-form-submit' });
  if (limited) return limited;

  // Reject oversized payloads early (5MB max — allows multiple guests with signatures)
  const MAX_BODY_SIZE = 5 * 1024 * 1024;
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Cererea depășește dimensiunea maximă permisă' }, { status: 413 });
  }

  const link = await prisma.guestFormLink.findUnique({
    where: { token: params.token },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          host: { select: { email: true, name: true, receptionistSignature: true } },
        },
      },
    },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Formular inactiv' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Date invalide', details: parsed.error.flatten() }, { status: 400 });
  }

  // Validate touristSignature format: must be empty or a valid data URI PNG
  for (const item of parsed.data) {
    if (item.touristSignature && !item.touristSignature.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formatul semnăturii turistului este invalid' },
        { status: 400 }
      );
    }
  }

  if (parsed.data.length > link.activeGuestCount) {
    return NextResponse.json(
      { error: `Numărul de formulare (${parsed.data.length}) depășește limita setată (${link.activeGuestCount})` },
      { status: 400 }
    );
  }

  const now = new Date();
  const confirmationIds: string[] = [];
  const emailSubmissions: Array<{ name: string; downloadUrl: string }> = [];
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
  for (const item of parsed.data) {
    const sanitized = {
      lastName:        sanitizeText(item.lastName),
      firstName:       sanitizeText(item.firstName),
      dateOfBirth:     sanitizeText(item.dateOfBirth),
      citizenship:     sanitizeText(item.citizenship),
      placeOfBirth:    sanitizeText(item.placeOfBirth),
      city:            sanitizeText(item.city),
      street:          sanitizeText(item.street),
      streetNumber:    sanitizeText(item.streetNumber),
      country:         sanitizeText(item.country),
      purposeOfTravel: sanitizeText(item.purposeOfTravel),
      documentType:    sanitizeText(item.documentType),
      idSeries:        sanitizeText(item.idSeries),
      idNumber:        sanitizeText(item.idNumber),
      checkInDate:     sanitizeText(item.checkInDate),
      checkOutDate:    sanitizeText(item.checkOutDate),
    };

    // Duplicate check
    const existing = await prisma.guestSubmission.findFirst({
      where: {
        propertyId: link.property.id,
        firstName:  sanitized.firstName,
        lastName:   sanitized.lastName,
        checkInDate: new Date(sanitized.checkInDate),
      },
      select: { id: true },
    });
    const isDuplicate = !!existing;

    // Generate Word doc
    const pregenId = crypto.randomUUID();
    let wordFileContent: Buffer | null = null;
    let fileName: string | null = null;

    try {
      const docBuffer = await generateRegistrationDoc({
        fullName:              `${sanitized.firstName} ${sanitized.lastName}`,
        dateOfBirth:           sanitized.dateOfBirth,
        placeOfBirth:          sanitized.placeOfBirth,
        nationality:           sanitized.citizenship,
        city:                  sanitized.city,
        street:                sanitized.street,
        streetNumber:          sanitized.streetNumber,
        country:               sanitized.country,
        arrivalDate:           sanitized.checkInDate,
        departureDate:         sanitized.checkOutDate,
        purposeOfTravel:       sanitized.purposeOfTravel,
        idType:                sanitized.documentType,
        idSeries:              sanitized.idSeries,
        idNumber:              sanitized.idNumber,
        touristSignature:      item.touristSignature || '',
        receptionistSignature: link.property.host.receptionistSignature || '',
      });
      wordFileContent = docBuffer;
      fileName = generateFileName(
        link.property.title,
        sanitized.firstName,
        sanitized.lastName,
        new Date(sanitized.checkInDate),
        pregenId
      );
    } catch (err) {
      console.error(`[guest-form-submit] Word doc generation failed for submission ${pregenId}:`, err);
    }

    const submission = await prisma.guestSubmission.create({
      data: {
        id:              pregenId,
        formLinkId:      link.id,
        propertyId:      link.property.id,
        lastName:        sanitized.lastName,
        firstName:       sanitized.firstName,
        dateOfBirth:     new Date(sanitized.dateOfBirth),
        citizenship:     sanitized.citizenship,
        placeOfBirth:    sanitized.placeOfBirth,
        city:            sanitized.city,
        street:          sanitized.street,
        streetNumber:    sanitized.streetNumber,
        country:         sanitized.country,
        purposeOfTravel: sanitized.purposeOfTravel,
        documentType:    sanitized.documentType,
        idSeries:        sanitized.idSeries,
        documentNumber:  sanitized.idNumber,
        checkInDate:     new Date(sanitized.checkInDate),
        checkOutDate:    new Date(sanitized.checkOutDate),
        numberOfGuests:  item.numberOfGuests,
        gdprConsent:     true,
        submittedAt:     now,
        retentionDate:   addYears(now, 5),
        isDuplicate,
        wordFileContent: wordFileContent ?? undefined,
        fileName:        fileName ?? undefined,
      },
      select: { id: true },
    });

    confirmationIds.push(submission.id);
    emailSubmissions.push({
      name: `${sanitized.firstName} ${sanitized.lastName}`,
      downloadUrl: `${APP_URL}/api/host/submissions/${submission.id}/download`,
    });
  }

  } catch (err) {
    console.error('[guest-form-submit] Submission processing error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }

  // Fire-and-forget email
  const firstCheckIn = parsed.data[0].checkInDate;
  const bulkIds = confirmationIds.join(',');
  const bulkDownloadUrl = `${APP_URL}/api/properties/${link.property.id}/submissions/bulk-download?ids=${bulkIds}`;

  sendGuestFormsSubmittedEmail(
    link.property.host.email,
    link.property.host.name,
    link.property.title,
    firstCheckIn,
    emailSubmissions,
    bulkDownloadUrl
  ).catch(() => {});

  return NextResponse.json({ confirmationIds });
}
