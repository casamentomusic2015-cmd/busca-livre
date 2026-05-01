'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImplicitCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização…');

  useEffect(() => {
    const hash = window.location.hash.slice(1); // remove leading #
    if (!hash) {
      setStatus('error');
      setMessage('Nenhum token encontrado no redirecionamento.');
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const expiresIn = parseInt(params.get('expires_in') ?? '21600', 10);

    if (!accessToken) {
      const error = params.get('error') ?? 'Token não encontrado';
      setStatus('error');
      setMessage(`Erro do Mercado Livre: ${error}`);
      return;
    }

    fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, expires_in: expiresIn }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; error?: string }) => {
        if (data.ok) {
          setStatus('success');
          setMessage('Token configurado com sucesso! Redirecionando…');
          setTimeout(() => router.push('/'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error ?? 'Falha ao salvar token');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erro de conexão ao salvar token');
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-fundo flex items-center justify-center p-6">
      <div className="bg-surface border border-borda rounded-xl p-8 max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-acento border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-texto">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-sucesso text-4xl">✓</p>
            <p className="text-texto font-semibold">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-desconto text-4xl">✗</p>
            <p className="text-texto font-semibold">Falha na autorização</p>
            <p className="text-texto-muted text-sm">{message}</p>
            <a href="/auth" className="inline-block text-acento text-sm hover:underline">
              Tentar outra abordagem →
            </a>
          </>
        )}
      </div>
    </main>
  );
}
