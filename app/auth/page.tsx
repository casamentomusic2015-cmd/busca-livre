'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuthPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token.trim() }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (res.ok) {
        setStatus('success');
        setMessage(data.message ?? 'Token configurado!');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Erro ao configurar token');
      }
    } catch {
      setStatus('error');
      setMessage('Erro de conexão');
    }
  }

  const clientId = '3030608072142858';
  const redirectUri = baseUrl ? `${baseUrl}/auth/callback` : '';
  const implicitRedirectUri = baseUrl ? `${baseUrl}/auth/callback` : '';
  const authUrl = redirectUri
    ? `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    : '#';
  const implicitAuthUrl = implicitRedirectUri
    ? `https://auth.mercadolivre.com.br/authorization?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(implicitRedirectUri)}`
    : '#';

  return (
    <main className="min-h-screen bg-fundo text-texto p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="text-acento text-sm hover:underline">← Voltar ao app</Link>
          <h1 className="text-2xl font-bold font-display mt-3">Configuração OAuth — Mercado Livre</h1>
          <p className="text-texto-muted mt-1">
            O Busca Livre precisa de um token de usuário para buscar produtos via API do Mercado Livre.
          </p>
        </div>

        {/* Opção 1 — Implicit flow (mais simples) */}
        <section className="bg-surface border border-acento/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Opção 1 — OAuth Implícito (mais simples)</h2>
            <span className="px-2 py-0.5 bg-acento text-black text-xs font-bold rounded-full">Recomendado</span>
          </div>
          <p className="text-texto-muted text-sm">
            Primeiro, cadastre as duas URIs abaixo no portal do desenvolvedor do Mercado Livre:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-texto-muted">
            <li>
              Acesse <span className="text-acento font-mono">developers.mercadolivre.com.br/devcenter</span>
            </li>
            <li>Clique no seu app (ID: <code className="bg-black/40 px-1 rounded">{clientId}</code>)</li>
            <li>Vá em <strong className="text-texto">Editar aplicação</strong> → seção <strong className="text-texto">OAuth</strong></li>
            <li>
              Em <strong className="text-texto">URIs de redirecionamento</strong>, adicione:
              <div className="mt-1 space-y-1">
                <div className="bg-black/40 border border-borda rounded px-3 py-2 font-mono text-xs text-acento break-all select-all">{redirectUri}</div>
                <div className="bg-black/40 border border-borda rounded px-3 py-2 font-mono text-xs text-acento break-all select-all">{implicitRedirectUri}</div>
              </div>
            </li>
            <li>Salve e clique no botão abaixo</li>
          </ol>
          <a
            href={implicitAuthUrl}
            className="inline-block mt-2 px-5 py-2.5 bg-acento text-black font-bold rounded-lg hover:bg-acento-hover transition-colors text-sm"
          >
            Autorizar com Mercado Livre →
          </a>
          <p className="text-texto-muted text-xs">
            O token é retornado diretamente na URL e configurado sem precisar de redirect de servidor.
            Válido por 6 horas — use a Opção 2 para um fluxo com refresh token.
          </p>
        </section>

        {/* Opção 2 — Authorization Code (com refresh token) */}
        <section className="bg-surface border border-borda rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Opção 2 — Authorization Code (com refresh token)</h2>
          <p className="text-texto-muted text-sm">
            Igual à Opção 1, mas usa o fluxo <code className="bg-black/40 px-1 rounded">authorization_code</code>{' '}
            que gera um <code className="bg-black/40 px-1 rounded">refresh_token</code> persistente.
            Registre a URI abaixo no portal do ML (se ainda não registrou):
          </p>
          <div className="bg-black/40 border border-borda rounded px-3 py-2 font-mono text-xs text-acento break-all select-all">
            {redirectUri}
          </div>
          <a
            href={authUrl}
            className="inline-block px-5 py-2.5 bg-surface border border-acento text-acento font-semibold rounded-lg hover:bg-acento/10 transition-colors text-sm"
          >
            Autorizar (com refresh token) →
          </a>
          <p className="text-texto-muted text-xs">
            Após autorizar, o terminal mostrará o <code className="bg-black/40 px-1 rounded">ML_REFRESH_TOKEN</code> para salvar no{' '}
            <code className="bg-black/40 px-1 rounded">.env.local</code> — isso faz o token ser renovado automaticamente.
          </p>
        </section>

        {/* Opção 2 — ngrok */}
        <section className="bg-surface border border-borda rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Opção 3 — ngrok (se localhost for bloqueado)</h2>
          <p className="text-texto-muted text-sm">
            Se o Mercado Livre bloquear o redirecionamento para localhost, use ngrok para criar um túnel público:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-texto-muted">
            <li>
              Instale o ngrok: <code className="bg-black/40 px-1 rounded">npm install -g ngrok</code>
            </li>
            <li>
              Execute: <code className="bg-black/40 px-1 rounded">ngrok http 3000</code>
            </li>
            <li>
              Copie a URL gerada (ex: <code className="bg-black/40 px-1 rounded">https://abc123.ngrok.io</code>)
            </li>
            <li>
              Atualize o <code className="bg-black/40 px-1 rounded">.env.local</code>:
              <div className="mt-1 bg-black/40 border border-borda rounded px-3 py-2 font-mono text-xs text-texto break-all">
                NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
              </div>
            </li>
            <li>Registre <code className="bg-black/40 px-1 rounded">https://abc123.ngrok.io/api/auth/callback</code> no portal do ML</li>
            <li>Reinicie o servidor e acesse <code className="bg-black/40 px-1 rounded">/api/auth/ml</code></li>
          </ol>
        </section>

        {/* Opção 3 — Token manual */}
        <section className="bg-surface border border-borda rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Opção 4 — Token manual</h2>
          <p className="text-texto-muted text-sm">
            Se você já tem um <code className="bg-black/40 px-1 rounded">access_token</code> válido de usuário
            (obtido via Postman, ML Playground, ou outra ferramenta OAuth), cole-o aqui:
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="APP_USR-..."
              rows={3}
              className="w-full bg-black/40 border border-borda rounded-lg px-3 py-2 font-mono text-xs text-texto placeholder-texto-muted focus:outline-none focus:border-acento resize-none"
            />
            <button
              type="submit"
              disabled={!token.trim() || status === 'loading'}
              className="px-5 py-2.5 bg-acento text-black font-bold rounded-lg hover:bg-acento-hover transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Configurando…' : 'Configurar token'}
            </button>
          </form>

          {status === 'success' && (
            <div className="flex items-start gap-2 p-3 bg-sucesso/10 border border-sucesso/30 rounded-lg">
              <span className="text-sucesso text-lg leading-none">✓</span>
              <div>
                <p className="text-sucesso text-sm font-semibold">{message}</p>
                <Link href="/" className="text-acento text-xs hover:underline">Ir para o app →</Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-desconto/10 border border-desconto/30 rounded-lg">
              <p className="text-desconto text-sm">{message}</p>
            </div>
          )}

          <div className="border-t border-borda pt-4">
            <p className="text-texto-muted text-xs font-semibold mb-2">Como obter um token via navegador:</p>
            <pre className="bg-black/40 border border-borda rounded-lg p-3 text-xs text-texto overflow-x-auto whitespace-pre-wrap break-all">
{`# 1. Abra esta URL no navegador:
https://auth.mercadolivre.com.br/authorization?response_type=token&client_id=${clientId}&redirect_uri=${implicitRedirectUri ? encodeURIComponent(implicitRedirectUri) : encodeURIComponent('/auth/callback')}

# 2. Após autorizar, a URL de retorno terá #access_token=APP_USR-...
# 3. Copie o valor do access_token e cole acima`}
            </pre>
          </div>
        </section>

        {/* Status atual */}
        <section className="bg-surface border border-borda rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold">Testar busca</h2>
          <p className="text-texto-muted text-sm">
            Após configurar um token, teste se a busca está funcionando:
          </p>
          <a
            href="/api/search?q=fone+de+ouvido&limit=3"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 bg-surface border border-acento text-acento font-semibold rounded-lg hover:bg-acento/10 transition-colors text-sm"
          >
            Testar API de busca →
          </a>
        </section>

      </div>
    </main>
  );
}
