import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { generateRegistrationDoc } from '@/lib/word-generator';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

  const required = { fullName, dateOfBirth, placeOfBirth, nationality, city, street, streetNumber, country, arrivalDate, departureDate, purposeOfTravel, idType, idSeries, idNumber, signatureImage };
  const missing = Object.entries(required).find(([, v]) => !v);
  if (missing) {
    return NextResponse.json({ error: `Câmpul "${missing[0]}" este obligatoriu` }, { status: 400 });
  }

  if (!String(signatureImage).startsWith('data:image/')) {
    return NextResponse.json({ error: 'Semnătura este invalidă' }, { status: 400 });
  }

  // Generate Word document
  const docBuffer = await generateRegistrationDoc({
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
    idSeries: sanitizeText(String(idSeries)),
    idNumber: sanitizeText(String(idNumber)),
    touristSignature: String(signatureImage),
    receptionistSignature: formRequest.host.receptionistSignature,
  });

  // Save file
  const uploadsDir = path.join(process.cwd(), 'uploads', 'registrations');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const wordFilePath = path.join('uploads', 'registrations', `${nextPending.id}.docx`);
  fs.writeFileSync(path.join(process.cwd(), wordFilePath), docBuffer);

  // Update GuestForm
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
      idSeries: sanitizeText(String(idSeries)),
      idNumber: sanitizeText(String(idNumber)),
      signatureImage: String(signatureImage),
      submittedAt: new Date(),
      wordFilePath,
    },
  });

  const remaining = formRequest.guestForms.filter(g => !g.submittedAt).length - 1;

  return NextResponse.json({
    guestIndex: nextPending.guestIndex,
    totalGuests: formRequest.totalGuests,
    hasMore: remaining > 0,
  });
}
