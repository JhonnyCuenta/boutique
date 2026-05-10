import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie, signUserToken } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Nom, email et mot de passe valide requis' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe deja avec cet email' }, { status: 409 });
    }

    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: parsed.data.name.trim(),
        role: UserRole.CUSTOMER,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signUserToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ success: true, user });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Customer register error:', error);
    return NextResponse.json({ error: 'Creation du compte impossible' }, { status: 500 });
  }
}
