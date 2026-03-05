import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { addYears } from 'date-fns';

export const dynamic = 'force-dynamic';

// POST /api/guest-form/[token]/submit — public, submit guest accommodation form
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const limited = rateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, prefix: 'guest-form' });
  if (limited) return limited;

  const link = await prisma.guestFormLink.findUnique({
    where: { token: params.token },
    select: { id: true, propertyId: true, isActive: true },
  });

  if (!link) return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  if (!link.isActive) return NextResponse.json({ error: 'Link inactiv' }, { status: 410 });

  const body = await req.json();
  const {
    lastName, firstName, dateOfBirth, citizenship,
    documentType, documentNumber,
    checkInDate, checkOutDate, numberOfGuests,
    gdprConsent,
  } = body;

  if (!gdprConsent) {
    return NextResponse.json({ error: 'Consimțământul GDPR este obligatoriu' }, { status: 400 });
  }

  if (!lastName || !firstName || !dateOfBirth || !citizenship || !documentType || !documentNumber || !checkInDate || !checkOutDate || !numberOfGuests) {
    return NextResponse.json({ error: 'Toate câmpurile sunt obligatorii' }, { status: 400 });
  }

  const submittedAt = new Date();

  const submission = await prisma.guestSubmission.create({
    data: {
      formLinkId: link.id,
      propertyId: link.propertyId,
      lastName: sanitizeText(String(lastName)),
      firstName: sanitizeText(String(firstName)),
      dateOfBirth: new Date(dateOfBirth),
      citizenship: sanitizeText(String(citizenship)),
      documentType: sanitizeText(String(documentType)),
      documentNumber: sanitizeText(String(documentNumber)),
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      numberOfGuests: Number(numberOfGuests),
      gdprConsent: true,
      submittedAt,
      retentionDate: addYears(submittedAt, 5),
    },
    select: { id: true },
  });

  return NextResponse.json({ confirmationId: submission.id });
}
