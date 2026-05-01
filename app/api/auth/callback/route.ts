import { NextRequest, NextResponse } from 'next/server';
import { setUserToken } from '@/lib/mercadolivre';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
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

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
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

    // Armazena o token em memória para uso imediato
    setUserToken(data.access_token, data.expires_in);

    console.log('[Auth] ✓ Token de usuário obtido! user_id:', data.user_id);
    console.log('[Auth] Refresh token (salve no .env.local como ML_REFRESH_TOKEN):');
    console.log('[Auth]', data.refresh_token);

    // Retorna página HTML com instruções
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autorização concluída — Busca Livre</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }
    .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 1rem; padding: 2rem; max-width: 600px; width: 100%; }
    h1 { color: #FFE600; font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; margin-bottom: 1rem; line-height: 1.6; }
    .token { background: #0a0a0a; border: 1px solid #FFE600; border-radius: 0.5rem; padding: 1rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; color: #FFE600; margin: 1rem 0; }
    .step { background: #1a1a1a; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.5rem; }
    .step strong { color: #FFE600; }
    a { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #FFE600; color: #000; font-weight: bold; border-radius: 0.75rem; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ Autorização concluída!</h1>
    <p>Conta <strong style="color:#f5f5f5">@${data.user_id}</strong> vinculada com sucesso. O app já pode buscar produtos.</p>
    <p>Para que o token persista entre reinicializações, adicione ao seu <code>.env.local</code>:</p>
    <div class="token">ML_REFRESH_TOKEN=${data.refresh_token}</div>
    <div class="step"><strong>Passo 1:</strong> Copie a linha acima e adicione ao arquivo <code>.env.local</code></div>
    <div class="step"><strong>Passo 2:</strong> Reinicie o servidor com <code>npm run dev</code></div>
    <a href="/">Ir para o app →</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[Auth] Erro:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
