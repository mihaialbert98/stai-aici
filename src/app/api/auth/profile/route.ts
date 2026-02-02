import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession, createToken, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });

  const body = await req.json();
  const data: any = {};

  if (body.name && typeof body.name === 'string' && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.phone === 'string') {
    data.phone = body.phone.trim() || null;
  }

  // Password change
  if (body.currentPassword && body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Parola nouă trebuie să aibă minim 6 caractere' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'Cont invalid' }, { status: 400 });

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Parola curentă este incorectă' }, { status: 400 });
    }

    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nimic de actualizat' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, email: true, name: true, phone: true, role: true },
  });

  // Refresh session cookie if name changed
  if (data.name) {
    const token = await createToken({ userId: updated.id, email: updated.email, name: updated.name, role: updated.role });
    const cookie = setSessionCookie(token);
    const res = NextResponse.json({ user: updated });
    res.cookies.set(cookie);
    return res;
  }

  return NextResponse.json({ user: updated });
}
