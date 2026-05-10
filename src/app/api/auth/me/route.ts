import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  const user = await getUserFromCookies();
  return NextResponse.json({ user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null });
}
