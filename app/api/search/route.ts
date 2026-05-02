import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buscarProdutos, setUserToken } from '@/lib/mercadolivre';
import type { FiltrosBusca, ResultadoBusca } from '@/types/produto';

export const runtime = 'nodejs';

async function tryRefresh(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

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

  if (!res.ok) return null;
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function GET(req: NextRequest) {
  const inicio = Date.now();
  const { searchParams } = req.nextUrl;

  const q = searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'Parâmetro "q" é obrigatório' }, { status: 400 });
  }

  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const sort = searchParams.get('sort') as FiltrosBusca['ordenacao'] | null;

  const filtros: Partial<FiltrosBusca> = {
    freteGratis: searchParams.get('frete_gratis') === 'true',
    precoMin: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    precoMax: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    avaliacaoMinima: searchParams.get('avaliacao_min')
      ? Number(searchParams.get('avaliacao_min'))
      : undefined,
    ordenacao: sort ?? 'score',
  };

  // Carrega token do cookie para memória antes de buscar
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('ml_access_token')?.value;
  const cookieRefresh = cookieStore.get('ml_refresh_token')?.value;

  if (cookieToken) setUserToken(cookieToken, 7200);

  console.log(`[API /search] query="${q}" limit=${limit} sort=${filtros.ordenacao} cookie_token=${!!cookieToken}`);

  const secure = process.env.NODE_ENV === 'production';

  type RefreshedCookies = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null;

  let refreshedCookies: RefreshedCookies = null;

  try {
    let searchResult: { produtos: ResultadoBusca['produtos']; total: number };

    try {
      searchResult = await buscarProdutos({ q, limit, filtros });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // 401 → tenta renovar via refresh token do cookie
      if (msg.includes('401') && cookieRefresh) {
        console.log('[API /search] 401 — renovando token via cookie...');
        const refreshed = await tryRefresh(cookieRefresh);
        if (!refreshed) throw err;
        setUserToken(refreshed.access_token, refreshed.expires_in);
        refreshedCookies = refreshed;
        searchResult = await buscarProdutos({ q, limit, filtros });
      } else {
        throw err;
      }
    }

    const tempoMs = Date.now() - inicio;
    console.log(`[API /search] ✓ ${searchResult.produtos.length} produtos em ${tempoMs}ms (total ML: ${searchResult.total})`);

    const resultado: ResultadoBusca = {
      produtos: searchResult.produtos,
      total: searchResult.total,
      query: q,
      tempoMs,
    };

    const response = NextResponse.json(resultado, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });

    // Atualiza cookies se o token foi renovado durante esta request
    if (refreshedCookies) {
      cookieStore.set('ml_access_token', refreshedCookies.access_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: refreshedCookies.expires_in,
        path: '/',
      });
      if (refreshedCookies.refresh_token) {
        cookieStore.set('ml_refresh_token', refreshedCookies.refresh_token, {
          httpOnly: true,
          secure,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 180,
          path: '/',
        });
      }
    }

    return response;
  } catch (err) {
    const tempoMs = Date.now() - inicio;
    const msg = err instanceof Error ? err.message : String(err);
    const mlBlocked = msg.includes('autorização') || msg.includes('403') || msg.includes('aborted');
    console.error(`[API /search] ✗ erro após ${tempoMs}ms (ml_blocked=${mlBlocked}):`, msg);
    return NextResponse.json(
      { error: msg, ml_blocked: mlBlocked },
      { status: 502 }
    );
  }
}
