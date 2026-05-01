import { NextResponse } from 'next/server';

// Redireciona o usuário para a página de autorização do Mercado Livre
export function GET() {
  const clientId = process.env.ML_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!clientId) {
    return NextResponse.json({ error: 'ML_CLIENT_ID não configurado' }, { status: 500 });
  }

  const redirectUri = `${appUrl}/api/auth/callback`;
  const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);

  return NextResponse.redirect(authUrl.toString());
}
