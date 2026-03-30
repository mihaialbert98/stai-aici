import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/properties/[id]/submissions — host only, paginated list
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, hostId: session.userId },
    select: { id: true },
  });
  if (!property) return NextResponse.json({ error: 'Proprietate negăsită' }, { status: 404 });

  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const monthParam = req.nextUrl.searchParams.get('month');
  const yearParam = req.nextUrl.searchParams.get('year');

  const dateFilter = yearParam
    ? {
        checkInDate: {
          gte: new Date(Number(yearParam), monthParam ? Number(monthParam) - 1 : 0, 1),
          lt:  new Date(Number(yearParam), monthParam ? Number(monthParam) : 12, 1),
        },
      }
    : {};

  const whereClause = { propertyId: params.id, ...dateFilter };

  const [submissions, total] = await Promise.all([
    prisma.guestSubmission.findMany({
      where: whereClause,
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        citizenship: true,
        documentType: true,
        documentNumber: true,
        dateOfBirth: true,
        checkInDate: true,
        checkOutDate: true,
        numberOfGuests: true,
        submittedAt: true,
        retentionDate: true,
        isDuplicate: true,
        fileName: true,
      },
    }),
    prisma.guestSubmission.count({ where: whereClause }),
  ]);

  return NextResponse.json({ submissions, total, page, pages: Math.ceil(total / limit) });
}
