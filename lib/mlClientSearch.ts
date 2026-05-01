/**
 * Busca direta ao ML API feita pelo browser (client-side).
 * Usada como fallback quando o servidor não consegue autenticar (IP bloqueado pelo ML).
 * O ML permite CORS de qualquer origin, então a requisição do browser funciona.
 */
import type { MLSearchResponse, MLProduto, Produto, FiltrosBusca } from '@/types/produto';
import { calcularScores } from '@/lib/ranking';

const ML_BASE_URL = 'https://api.mercadolibre.com';
const SITE_ID = 'MLB';

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

function gerarLinkAfiliado(permalink: string): string {
  const trackingId = process.env.NEXT_PUBLIC_ML_TRACKING_ID;
  if (!trackingId || !permalink) return permalink;
  try {
    const url = new URL(permalink);
    url.searchParams.set('tracking_id', trackingId);
    return url.toString();
  } catch {
    return permalink;
  }
}

function mapProduto(item: MLProduto): Produto {
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

export async function buscarDireto(
  q: string,
  limit = 20,
  filtros?: Partial<FiltrosBusca>,
  signal?: AbortSignal
): Promise<{ produtos: Produto[]; total: number }> {
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

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!res.ok) {
    throw new Error(`ML direto ${res.status}`);
  }

  const data = (await res.json()) as MLSearchResponse;
  const produtos = data.results.map(mapProduto);
  let comScore = calcularScores(produtos);

  if (filtros?.ordenacao === 'score') {
    comScore.sort((a, b) => b.score - a.score);
  } else if (filtros?.ordenacao === 'discount') {
    comScore.sort((a, b) => (b.desconto_percentual ?? 0) - (a.desconto_percentual ?? 0));
  }

  const filtrados = filtros?.avaliacaoMinima
    ? comScore.filter((p) => (p.avaliacao?.media ?? 0) >= filtros.avaliacaoMinima!)
    : comScore;

  return { produtos: filtrados, total: data.paging.total };
}
