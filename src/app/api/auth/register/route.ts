import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email deja înregistrat' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name, role: data.role as any },
    });

    const token = await createToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    const cookie = setSessionCookie(token);

    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(cookie);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Eroare la înregistrare' }, { status: 400 });
  }
}
