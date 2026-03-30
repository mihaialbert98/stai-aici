import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/properties/[id]/submissions/export — host only, CSV download
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, hostId: session.userId },
    select: { id: true, title: true },
  });
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const submissions = await prisma.guestSubmission.findMany({
    where: { propertyId: params.id },
    orderBy: { checkInDate: 'desc' },
    take: 10_000,
    select: {
      lastName: true,
      firstName: true,
      dateOfBirth: true,
      citizenship: true,
      documentType: true,
      documentNumber: true,
      checkInDate: true,
      checkOutDate: true,
      numberOfGuests: true,
      submittedAt: true,
    },
  });

  const dateStr = (d: Date) => format(d, 'dd.MM.yyyy');

  const header = 'Nume,Prenume,Data nasterii,Cetatenie,Tip document,Nr document,Check-in,Check-out,Nr persoane,Data inregistrarii';
  const rows = submissions.map(s =>
    [
      s.lastName,
      s.firstName,
      dateStr(s.dateOfBirth),
      s.citizenship,
      s.documentType,
      s.documentNumber,
      dateStr(s.checkInDate),
      dateStr(s.checkOutDate),
      s.numberOfGuests,
      dateStr(s.submittedAt),
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  const filename = `fise-cazare-${property.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
