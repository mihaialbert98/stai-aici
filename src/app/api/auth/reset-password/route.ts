import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyResetToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Parola trebuie să aibă minim 6 caractere' }, { status: 400 });
    }

    const payload = await verifyResetToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Cont invalid' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: 'Parola a fost resetată cu succes!' });
  } catch {
    return NextResponse.json({ error: 'Eroare la resetarea parolei' }, { status: 500 });
  }
}
