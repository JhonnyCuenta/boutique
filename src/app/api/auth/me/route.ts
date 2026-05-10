import { NextResponse } from 'next/server';
import { getOwnerFromCookies } from '@/lib/auth';

export async function GET() {
  const owner = await getOwnerFromCookies();
  return NextResponse.json({ user: owner ? { id: owner.id, email: owner.email, name: owner.name } : null });
}
