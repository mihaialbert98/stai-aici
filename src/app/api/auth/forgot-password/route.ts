import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const blocked = rateLimit(req, { limit: 3, windowMs: 15 * 60 * 1000, prefix: 'forgot' });
  if (blocked) return blocked;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email necesar' }, { status: 400 });
    }

    // Generic response to prevent user enumeration
    const successMsg = { message: 'Dacă adresa există în sistem, vei primi un email cu instrucțiuni.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json(successMsg);
    }

    const token = await createResetToken(user.id, user.email);
    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json(successMsg);
  } catch {
    return NextResponse.json({ error: 'Eroare la trimitere' }, { status: 500 });
  }
}
