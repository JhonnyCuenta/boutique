import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie, signUserToken } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const token = signUserToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Owner login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
