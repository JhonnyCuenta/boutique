import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const AUTH_COOKIE = 'mw_owner_session';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

type OwnerToken = {
  userId: string;
  email: string;
  role: 'OWNER';
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET manquant ou trop court');
  }
  return secret;
}

export function signOwnerToken(payload: OwnerToken) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: `${TOKEN_EXPIRY_SECONDS}s` });
}

export function verifyOwnerToken(token: string): OwnerToken | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as OwnerToken;
    return payload.role === 'OWNER' ? payload : null;
  } catch {
    return null;
  }
}

export async function getOwnerFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyOwnerToken(token);
  if (!payload) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return user?.role === 'OWNER' ? user : null;
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
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
