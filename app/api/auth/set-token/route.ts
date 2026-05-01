import { NextRequest, NextResponse } from 'next/server';
import { setUserToken } from '@/lib/mercadolivre';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { access_token?: string; expires_in?: number };
    const { access_token, expires_in = 21600 } = body;

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ error: 'access_token obrigatório' }, { status: 400 });
    }

    setUserToken(access_token.trim(), expires_in);

    return NextResponse.json({
      ok: true,
      message: 'Token configurado com sucesso. Agora você pode buscar produtos.',
      expires_in,
    });
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }
}
