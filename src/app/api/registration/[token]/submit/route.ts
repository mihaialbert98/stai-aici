import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { generateRegistrationDoc } from '@/lib/word-generator';

export const dynamic = 'force-dynamic';

const ID_TYPES_WITH_SERIES = ['Carte de identitate'];

// POST /api/registration/[token]/submit — public, submit guest form + generate .docx
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const limited = rateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, prefix: 'registration' });
  if (limited) return limited;

  const formRequest = await prisma.formRequest.findUnique({
    where: { publicToken: params.token },
    include: {
      host: { select: { receptionistSignature: true } },
      guestForms: {
        orderBy: { guestIndex: 'asc' },
        select: { id: true, guestIndex: true, submittedAt: true },
      },
    },
  });

  if (!formRequest) {
    return NextResponse.json({ error: 'Link invalid' }, { status: 404 });
  }

  const nextPending = formRequest.guestForms.find(g => !g.submittedAt);
  if (!nextPending) {
    return NextResponse.json({ error: 'Toate formularele au fost deja completate' }, { status: 409 });
  }

  if (!formRequest.host.receptionistSignature) {
    return NextResponse.json({ error: 'Semnătura recepționistului lipsește' }, { status: 422 });
  }

  const body = await req.json();
  const {
    fullName, dateOfBirth, placeOfBirth, nationality,
    city, street, streetNumber, country,
    arrivalDate, departureDate,
    purposeOfTravel, idType, idSeries, idNumber,
    signatureImage,
  } = body;

  const requiresSeries = ID_TYPES_WITH_SERIES.includes(idType);

  const requiredFields: Record<string, unknown> = {
    fullName, dateOfBirth, placeOfBirth, nationality,
    city, street, streetNumber, country,
    arrivalDate, departureDate, purposeOfTravel, idType, idNumber, signatureImage,
  };
  if (requiresSeries) requiredFields.idSeries = idSeries;

  const missing = Object.entries(requiredFields).find(([, v]) => !v);
  if (missing) {
    return NextResponse.json({ error: `Câmpul "${missing[0]}" este obligatoriu` }, { status: 400 });
  }

  if (!String(signatureImage).startsWith('data:image/')) {
    return NextResponse.json({ error: 'Semnătura este invalidă' }, { status: 400 });
  }
  if (String(signatureImage).length > 500_000) {
    return NextResponse.json({ error: 'Semnătura depășește dimensiunea maximă permisă' }, { status: 400 });
  }

  const seriesValue = requiresSeries ? sanitizeText(String(idSeries)) : '';

  // Generate Word document
  let docBuffer: Buffer;
  try {
    docBuffer = await generateRegistrationDoc({
      fullName: sanitizeText(String(fullName)),
      dateOfBirth: sanitizeText(String(dateOfBirth)),
      placeOfBirth: sanitizeText(String(placeOfBirth)),
      nationality: sanitizeText(String(nationality)),
      city: sanitizeText(String(city)),
      street: sanitizeText(String(street)),
      streetNumber: sanitizeText(String(streetNumber)),
      country: sanitizeText(String(country)),
      arrivalDate: sanitizeText(String(arrivalDate)),
      departureDate: sanitizeText(String(departureDate)),
      purposeOfTravel: sanitizeText(String(purposeOfTravel)),
      idType: sanitizeText(String(idType)),
      idSeries: seriesValue,
      idNumber: sanitizeText(String(idNumber)),
      touristSignature: String(signatureImage),
      receptionistSignature: formRequest.host.receptionistSignature,
    });
  } catch (err) {
    console.error('generateRegistrationDoc failed:', err);
    return NextResponse.json({ error: 'Eroare la generarea documentului Word' }, { status: 500 });
  }

  // Update GuestForm — store docx in DB (works on any hosting, no filesystem needed)
  await prisma.guestForm.update({
    where: { id: nextPending.id },
    data: {
      fullName: sanitizeText(String(fullName)),
      dateOfBirth: sanitizeText(String(dateOfBirth)),
      placeOfBirth: sanitizeText(String(placeOfBirth)),
      nationality: sanitizeText(String(nationality)),
      city: sanitizeText(String(city)),
      street: sanitizeText(String(street)),
      streetNumber: sanitizeText(String(streetNumber)),
      country: sanitizeText(String(country)),
      arrivalDate: sanitizeText(String(arrivalDate)),
      departureDate: sanitizeText(String(departureDate)),
      purposeOfTravel: sanitizeText(String(purposeOfTravel)),
      idType: sanitizeText(String(idType)),
      idSeries: seriesValue,
      idNumber: sanitizeText(String(idNumber)),
      signatureImage: String(signatureImage),
      submittedAt: new Date(),
      wordFilePath: 'db',
      wordFileContent: docBuffer,
    },
  });

  const remaining = formRequest.guestForms.filter(g => !g.submittedAt).length - 1;

  return NextResponse.json({
    guestIndex: nextPending.guestIndex,
    totalGuests: formRequest.totalGuests,
    hasMore: remaining > 0,
  });
}
