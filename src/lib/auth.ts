import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const AUTH_COOKIE = 'mw_session';
export const LEGACY_OWNER_COOKIE = 'mw_owner_session';
export const AUTH_COOKIE_NAMES = [AUTH_COOKIE, LEGACY_OWNER_COOKIE] as const;
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

type SessionRole = 'OWNER' | 'CUSTOMER';

type SessionToken = {
  userId: string;
  email: string;
  role: SessionRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET manquant ou trop court');
  }
  return secret;
}

export function signUserToken(payload: SessionToken) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: `${TOKEN_EXPIRY_SECONDS}s` });
}

export function verifyUserToken(token: string): SessionToken | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionToken;
    return payload.role === 'OWNER' || payload.role === 'CUSTOMER' ? payload : null;
  } catch {
    return null;
  }
}

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const token = AUTH_COOKIE_NAMES.map((name) => cookieStore.get(name)?.value).find(Boolean);
  if (!token) return null;

  const payload = verifyUserToken(token);
  if (!payload) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return user || null;
}

export async function getOwnerFromCookies() {
  const user = await getUserFromCookies();
  return user?.role === 'OWNER' ? user : null;
}

export async function requireUser() {
  const user = await getUserFromCookies();
  if (!user) redirect('/login?next=/account');
  return user;
}

export async function requireOwner() {
  const owner = await getOwnerFromCookies();
  if (!owner) redirect('/login');
  return owner;
}

export class AuthError extends Error {
  status = 401;
}

export async function requireOwnerApi() {
  const owner = await getOwnerFromCookies();
  if (!owner) {
    throw new AuthError('Connexion owner requise');
  }
  return owner;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_EXPIRY_SECONDS,
  });
}

export function clearAuthCookie(response: NextResponse) {
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  });
}
