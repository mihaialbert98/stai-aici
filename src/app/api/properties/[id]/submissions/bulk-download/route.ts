import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, hostId: session.userId },
    select: { id: true, title: true },
  });
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const idsParam = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: 'Too many IDs (max 200)' }, { status: 400 });

  const submissions = await prisma.guestSubmission.findMany({
    where: {
      id: { in: ids },
      propertyId: params.id,
      property: { hostId: session.userId },
    },
    select: { id: true, wordFileContent: true, fileName: true },
  });

  if (submissions.length !== ids.length) {
    return NextResponse.json({ error: 'Some IDs are not accessible' }, { status: 403 });
  }

  const zip = new JSZip();
  for (const sub of submissions) {
    if (sub.wordFileContent) {
      zip.file(sub.fileName ?? `fisa-${sub.id}.docx`, sub.wordFileContent);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const slug = property.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const zipFilename = `fise-cazare-${slug}-${dateStr}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
    },
  });
}
