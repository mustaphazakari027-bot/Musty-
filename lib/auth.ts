import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'zak_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'zakson-dev-secret-please-set-AUTH_SECRET-in-production-32+',
);

export type Role = 'customer' | 'staff' | 'admin';
export type SessionUser = { id: number; email: string; name: string; role: Role };

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const row = db
      .prepare('SELECT id, email, name, role FROM users WHERE id = ?')
      .get(id) as SessionUser | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireAdminSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== 'admin' && session.role !== 'staff') return null;
  return session;
}

export function isStaff(session: SessionUser | null) {
  return session?.role === 'admin' || session?.role === 'staff';
}

export function isAdmin(session: SessionUser | null) {
  return session?.role === 'admin';
}

export { SESSION_COOKIE };
