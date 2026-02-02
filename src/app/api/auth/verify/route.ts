import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVerificationToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token lipsă' }, { status: 400 });
    }

    const payload = await verifyVerificationToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalid sau expirat. Solicită un nou email de verificare.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilizatorul nu a fost găsit' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email deja verificat. Poți să te autentifici.' });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: true },
    });

    return NextResponse.json({ message: 'Email verificat cu succes! Poți să te autentifici.' });
  } catch {
    return NextResponse.json({ error: 'Eroare la verificare' }, { status: 500 });
  }
}
