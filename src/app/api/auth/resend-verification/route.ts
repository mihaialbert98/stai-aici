import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email necesar' }, { status: 400 });
    }

    // Generic response to prevent user enumeration
    const successMsg = { message: 'Dacă adresa există în sistem, vei primi un email de verificare.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return NextResponse.json(successMsg);
    }

    const token = await createVerificationToken(user.id, user.email);
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json(successMsg);
  } catch {
    return NextResponse.json({ error: 'Eroare la trimitere' }, { status: 500 });
  }
}
