import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setUserToken } from '@/lib/mercadolivre';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('ml_refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Sem refresh token' }, { status: 401 });
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Credenciais ML não configuradas' }, { status: 500 });
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Auth Refresh] Falha ao renovar token:', res.status, body.slice(0, 120));
    return NextResponse.json({ error: 'Falha ao renovar token' }, { status: 502 });
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set('ml_access_token', data.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: data.expires_in,
    path: '/',
  });

  if (data.refresh_token) {
    cookieStore.set('ml_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180,
      path: '/',
    });
  }

  setUserToken(data.access_token, data.expires_in);

  console.log('[Auth Refresh] ✓ Token renovado com sucesso');
  return NextResponse.json({ success: true });
}
