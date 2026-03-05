import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/host/form-requests — list all host's form requests
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const formRequests = await prisma.formRequest.findMany({
    where: { hostId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { id: true, title: true } },
      guestForms: {
        select: {
          id: true,
          guestIndex: true,
          fullName: true,
          arrivalDate: true,
          departureDate: true,
          submittedAt: true,
          wordFilePath: true,
        },
        orderBy: { guestIndex: 'asc' },
      },
    },
  });

  return NextResponse.json({ formRequests });
}

// POST /api/host/form-requests — create new form request
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  // Require receptionist signature
  const host = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { receptionistSignature: true },
  });
  if (!host?.receptionistSignature) {
    return NextResponse.json(
      { error: 'Adaugă semnătura de recepționist înainte de a crea un formular' },
      { status: 422 }
    );
  }

  const { propertyId, totalGuests, bookingId } = await req.json();

  if (!propertyId || !totalGuests) {
    return NextResponse.json({ error: 'Câmpuri obligatorii lipsă' }, { status: 400 });
  }

  if (totalGuests < 1 || totalGuests > 20) {
    return NextResponse.json({ error: 'Numărul de oaspeți trebuie să fie între 1 și 20' }, { status: 400 });
  }

  // Verify property belongs to host
  const property = await prisma.property.findFirst({
    where: { id: propertyId, hostId: session.userId },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });
  }

  const formRequest = await prisma.formRequest.create({
    data: {
      propertyId,
      hostId: session.userId,
      bookingId: bookingId || null,
      totalGuests: Number(totalGuests),
      guestForms: {
        create: Array.from({ length: Number(totalGuests) }, (_, i) => ({
          guestIndex: i + 1,
        })),
      },
    },
    include: { guestForms: { select: { id: true, guestIndex: true } } },
  });

  return NextResponse.json({ formRequest });
}
