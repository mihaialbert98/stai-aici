import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const amenities = await prisma.amenity.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ amenities });
}
