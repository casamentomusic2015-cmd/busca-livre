import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setUserToken } from '@/lib/mercadolivre';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const codeVerifier = searchParams.get('code_verifier');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.json(
      { error: error ?? 'Código de autorização não recebido' },
      { status: 400 }
    );
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Credenciais ML não configuradas' }, { status: 500 });
  }

  const redirectUri = `${appUrl}/auth/callback`;

  console.log('CALLBACK RECEBIDO:', {
    code: code,
    redirectUri,
    appUrl,
  });

  try {
    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };
    if (codeVerifier) tokenBody.code_verifier = codeVerifier;

    console.log('ENVIANDO PARA ML:', {
      ...tokenBody,
      client_secret: '***',
      code_verifier: codeVerifier ? '***' : undefined,
    });

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenBody),
      cache: 'no-store',
    });

    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number;
    };

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao trocar code por token', detail: data }, { status: 502 });
    }

    // Persiste os tokens em cookies HTTP-only
    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === 'production';

    cookieStore.set('ml_access_token', data.access_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: data.expires_in,
      path: '/',
    });

    cookieStore.set('ml_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180,
      path: '/',
    });

    // Também armazena em memória para uso imediato nesta instância
    setUserToken(data.access_token, data.expires_in);

    console.log('[Auth] ✓ Token de usuário obtido! user_id:', data.user_id);

    return NextResponse.redirect(`${appUrl}/?auth=success`);
  } catch (err) {
    console.error('[Auth] Erro:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
