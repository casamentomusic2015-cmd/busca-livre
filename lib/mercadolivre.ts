import type { MLSearchResponse, MLProduto, Produto, FiltrosBusca } from '@/types/produto';
import { gerarLinkAfiliado } from '@/lib/affiliate';
import { calcularScores } from '@/lib/ranking';

const ML_BASE_URL = 'https://api.mercadolibre.com';
const SITE_ID = 'MLB';

// ─── Cache de token em memória ────────────────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt: number;
  type: 'user' | 'app';
}

let tokenCache: TokenCache | null = null;

/** Armazena um user token obtido via OAuth callback (acesso imediato sem env). */
export function setUserToken(accessToken: string, expiresIn: number): void {
  tokenCache = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
    type: 'user',
  };
  console.log('[ML Auth] User token armazenado em memória, expira em', expiresIn, 's');
}

async function getAccessToken(): Promise<{ token: string; type: 'user' | 'app' }> {
  // 1. Token em memória ainda válido
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return { token: tokenCache.accessToken, type: tokenCache.type };
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  // 2. Token estático via ML_ACCESS_TOKEN
  if (process.env.ML_ACCESS_TOKEN) {
    return { token: process.env.ML_ACCESS_TOKEN, type: 'user' };
  }

  if (!clientId || !clientSecret) {
    throw new Error('Defina ML_CLIENT_ID e ML_CLIENT_SECRET no .env.local');
  }

  // 3. Refresh token (obtido após autorização OAuth) → user token
  const refreshToken = process.env.ML_REFRESH_TOKEN;
  if (refreshToken) {
    console.log('[ML Auth] Renovando via refresh_token...');
    const res = await fetch(`${ML_BASE_URL}/oauth/token`, {
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

    const bodyText = await res.text();
    console.log(`[ML Auth] Refresh status: ${res.status} | Body início: ${bodyText.slice(0, 120)}`);

    if (res.ok) {
      const data = JSON.parse(bodyText) as { access_token: string; expires_in: number };
      tokenCache = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000, type: 'user' };
      return { token: data.access_token, type: 'user' };
    }
    console.warn('[ML Auth] Refresh token inválido ou expirado, tentando client_credentials...');
  }

  // 4. Client credentials (app token — funciona para /products/search, não para /sites/MLB/search)
  console.log('[ML Auth] Obtendo app token via client_credentials...');
  const res = await fetch(`${ML_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  });

  const bodyText = await res.text();
  console.log(`[ML Auth] client_credentials status: ${res.status} | Body início: ${bodyText.slice(0, 120)}`);

  if (!res.ok) throw new Error(`OAuth falhou (${res.status}): ${bodyText.slice(0, 200)}`);

  const data = JSON.parse(bodyText) as { access_token: string; expires_in: number };
  tokenCache = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000, type: 'app' };
  console.log(`[ML Auth] ✓ App token obtido. Expira em ${data.expires_in}s`);
  return { token: data.access_token, type: 'app' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapReputacao(levelId: string | null | undefined): Produto['vendedor']['reputacao'] {
  if (!levelId) return null;
  const mapa: Record<string, Produto['vendedor']['reputacao']> = {
    '5_green': 'platinum',
    '4_light_green': 'gold',
    '3_yellow': 'silver',
    '2_orange': 'bronze',
    '1_red': 'green',
  };
  return mapa[levelId] ?? null;
}

export function mlProdutoToProduto(item: MLProduto): Produto {
  return {
    id: item.id,
    titulo: item.title,
    preco: item.price,
    preco_original: item.original_price,
    desconto_percentual:
      item.original_price && item.original_price > item.price
        ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
        : undefined,
    imagem: item.thumbnail.replace(/\bI\b/, 'O'),
    link_afiliado: gerarLinkAfiliado(item.permalink),
    permalink: item.permalink,
    vendedor: {
      id: item.seller.id,
      nome: item.seller.nickname,
      reputacao: mapReputacao(item.seller.seller_reputation?.level_id),
    },
    frete_gratis: item.shipping.free_shipping,
    avaliacao: item.reviews
      ? { media: item.reviews.rating_average, total: item.reviews.total }
      : undefined,
    condicao: item.condition,
    score: 0,
  };
}

// ─── Busca principal ──────────────────────────────────────────────────────────

export interface SearchParams {
  q: string;
  limit?: number;
  filtros?: Partial<FiltrosBusca>;
}

export async function buscarProdutos(
  params: SearchParams
): Promise<{ produtos: Produto[]; total: number }> {
  const { q, limit = 20, filtros } = params;
  const { token, type } = await getAccessToken();

  const url = new URL(`${ML_BASE_URL}/sites/${SITE_ID}/search`);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(Math.min(limit, 50)));

  if (filtros?.freteGratis) url.searchParams.set('shipping_cost', 'free');
  if (filtros?.precoMin && filtros?.precoMax) {
    url.searchParams.set('price', `${filtros.precoMin}-${filtros.precoMax}`);
  } else if (filtros?.precoMin) {
    url.searchParams.set('price', `${filtros.precoMin}-*`);
  } else if (filtros?.precoMax) {
    url.searchParams.set('price', `*-${filtros.precoMax}`);
  }

  const mlSort: Record<string, string> = {
    relevance: 'relevance',
    price_asc: 'price_asc',
    price_desc: 'price_desc',
  };
  if (filtros?.ordenacao && mlSort[filtros.ordenacao]) {
    url.searchParams.set('sort', mlSort[filtros.ordenacao]);
  }

  const scraperKey = process.env.SCRAPER_API_KEY;
  const fetchUrl = scraperKey
    ? `https://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(url.toString())}&render=false&country_code=br&keep_headers=true`
    : url.toString();

  console.log(`[ML Search] token_type=${type} proxy=${!!scraperKey} url=${url.toString()}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let res: Response;
  try {
    res = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const bodyText = await res.text();
  console.log(`[ML Search] Status: ${res.status} | Body início: ${bodyText.slice(0, 150)}`);

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        'A busca requer autorização do usuário. Acesse http://localhost:3000/auth para configurar o token.'
      );
    }
    throw new Error(`ML API erro ${res.status}: ${bodyText.slice(0, 200)}`);
  }

  const data = JSON.parse(bodyText) as MLSearchResponse;
  const produtos = data.results.map(mlProdutoToProduto);
  const comScore = calcularScores(produtos);

  if (filtros?.ordenacao === 'score') {
    comScore.sort((a, b) => b.score - a.score);
  } else if (filtros?.ordenacao === 'discount') {
    comScore.sort((a, b) => (b.desconto_percentual ?? 0) - (a.desconto_percentual ?? 0));
  }

  const filtrados =
    filtros?.avaliacaoMinima
      ? comScore.filter((p) => (p.avaliacao?.media ?? 0) >= filtros.avaliacaoMinima!)
      : comScore;

  return { produtos: filtrados, total: data.paging.total };
}

// ─── Detalhe ──────────────────────────────────────────────────────────────────

export async function buscarDetalhe(id: string): Promise<MLProduto> {
  const { token } = await getAccessToken();
  const url = `${ML_BASE_URL}/items/${id}`;

  const scraperKey = process.env.SCRAPER_API_KEY;
  const fetchUrl = scraperKey
    ? `https://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(url)}`
    : url;

  console.log('[ML Detalhe] URL:', url, scraperKey ? '(via ScraperAPI)' : '');

  const res = await fetch(fetchUrl, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    next: { revalidate: 300 },
  });

  const bodyText = await res.text();
  console.log(`[ML Detalhe] Status: ${res.status} | Body início: ${bodyText.slice(0, 150)}`);

  if (!res.ok) throw new Error(`ML API erro ${res.status}: ${bodyText.slice(0, 100)}`);
  return JSON.parse(bodyText) as MLProduto;
}
