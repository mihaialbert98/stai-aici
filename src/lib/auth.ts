import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
const COOKIE_NAME = 'stai-aici-token';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(token: string) {
  // Returns cookie options for the response
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

// Email verification tokens
interface VerificationPayload {
  userId: string;
  email: string;
  purpose: 'verify';
}

export async function createVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, purpose: 'verify' } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyVerificationToken(token: string): Promise<VerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if ((payload as any).purpose !== 'verify') return null;
    return payload as unknown as VerificationPayload;
  } catch {
    return null;
  }
}

// Password reset tokens
interface ResetPayload {
  userId: string;
  email: string;
  purpose: 'reset';
}

export async function createResetToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, purpose: 'reset' } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyResetToken(token: string): Promise<ResetPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if ((payload as any).purpose !== 'reset') return null;
    return payload as unknown as ResetPayload;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  };
}
