import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setUserToken } from '@/lib/mercadolivre';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { access_token?: string; expires_in?: number };
    const { access_token, expires_in = 21600 } = body;

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ error: 'access_token obrigatório' }, { status: 400 });
    }

    const token = access_token.trim();

    // Salva em memória para uso imediato nesta instância
    setUserToken(token, expires_in);

    // Persiste em cookie HTTP-only para sobreviver a restarts e múltiplas instâncias
    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === 'production';
    cookieStore.set('ml_access_token', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: expires_in,
      path: '/',
    });

    return NextResponse.json({
      ok: true,
      message: 'Token configurado com sucesso. Agora você pode buscar produtos.',
      expires_in,
    });
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }
}
