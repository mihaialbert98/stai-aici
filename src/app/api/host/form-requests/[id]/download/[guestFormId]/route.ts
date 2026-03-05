import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/host/form-requests/[id]/download/[guestFormId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; guestFormId: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'HOST') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const guestForm = await prisma.guestForm.findFirst({
    where: {
      id: params.guestFormId,
      formRequest: { id: params.id, hostId: session.userId },
    },
    select: { id: true, fullName: true, wordFilePath: true, wordFileContent: true, submittedAt: true },
  });

  if (!guestForm) {
    return NextResponse.json({ error: 'Formular negăsit' }, { status: 404 });
  }

  if (!guestForm.submittedAt) {
    return NextResponse.json({ error: 'Documentul nu a fost generat încă' }, { status: 404 });
  }

  const safeName = (guestForm.fullName || guestForm.id).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filename = `fisa-cazare-${safeName}.docx`;
  const contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // New records: content stored in DB
  if (guestForm.wordFileContent) {
    return new NextResponse(guestForm.wordFileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // Legacy: content stored on filesystem
  if (guestForm.wordFilePath && guestForm.wordFilePath !== 'db') {
    const absolutePath = path.join(process.cwd(), guestForm.wordFilePath);
    if (fs.existsSync(absolutePath)) {
      const fileBuffer = fs.readFileSync(absolutePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  }

  return NextResponse.json({ error: 'Fișierul nu a fost găsit' }, { status: 404 });
}
