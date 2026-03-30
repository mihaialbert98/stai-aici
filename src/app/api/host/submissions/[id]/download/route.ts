import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const submission = await prisma.guestSubmission.findFirst({
    where: {
      id: params.id,
      property: { hostId: session.userId },
    },
    select: { id: true, wordFileContent: true, fileName: true },
  });

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!submission.wordFileContent) {
    return NextResponse.json({ error: 'Document nedisponibil' }, { status: 404 });
  }

  const filename = submission.fileName ?? `fisa-cazare-${submission.id}.docx`;

  return new NextResponse(new Uint8Array(submission.wordFileContent), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
