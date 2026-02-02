import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Email sau parolă incorectă' }, { status: 401 });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Email sau parolă incorectă' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Emailul nu a fost verificat. Verifică-ți inbox-ul sau retrimite emailul de verificare.', needsVerification: true, email: user.email },
        { status: 403 }
      );
    }

    const token = await createToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    const cookie = setSessionCookie(token);

    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(cookie);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Eroare la autentificare' }, { status: 400 });
  }
}
