import type { Produto } from '@/types/produto';

const PESOS = {
  preco: 0.35,
  reputacao: 0.25,
  frete: 0.20,
  avaliacao: 0.15,
  condicao: 0.05,
} as const;

function scoreReputacao(reputacao: Produto['vendedor']['reputacao']): number {
  const mapa: Record<NonNullable<Produto['vendedor']['reputacao']>, number> = {
    platinum: 100,
    gold: 80,
    silver: 60,
    bronze: 40,
    green: 20,
  };
  return reputacao ? mapa[reputacao] : 0;
}

function scoreAvaliacao(avaliacao: Produto['avaliacao']): number {
  if (!avaliacao || avaliacao.total === 0) return 0;
  const mediaScore = (avaliacao.media / 5) * 100;
  const volumeScore = Math.min(avaliacao.total / 100, 1) * 100;
  return mediaScore * 0.7 + volumeScore * 0.3;
}

/** Calcula scores para uma lista, normalizando preço dentro do conjunto. */
export function calcularScores(produtos: Produto[]): Produto[] {
  if (produtos.length === 0) return [];

  const precos = produtos.map((p) => p.preco).filter((v) => v > 0);
  const precoMin = Math.min(...precos);
  const precoMax = Math.max(...precos);
  const precoRange = precoMax - precoMin || 1;

  return produtos.map((produto) => {
    const scorePreco = ((precoMax - produto.preco) / precoRange) * 100;
    const score = calcularScore(produto, scorePreco);
    return { ...produto, score };
  });
}

/**
 * Calcula score 0–100 de um produto individual.
 * @param produto - produto a pontuar
 * @param scorePrecoNormalizado - score de preço já normalizado (0–100, maior = melhor)
 */
export function calcularScore(
  produto: Produto,
  scorePrecoNormalizado = 50
): number {
  const parcelas = {
    preco: scorePrecoNormalizado * PESOS.preco,
    reputacao: scoreReputacao(produto.vendedor.reputacao) * PESOS.reputacao,
    frete: (produto.frete_gratis ? 100 : 0) * PESOS.frete,
    avaliacao: scoreAvaliacao(produto.avaliacao) * PESOS.avaliacao,
    condicao: (produto.condicao === 'new' ? 100 : 0) * PESOS.condicao,
  };

  const total = Object.values(parcelas).reduce((acc, v) => acc + v, 0);
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function ordenarPorScore(produtos: Produto[]): Produto[] {
  return [...produtos].sort((a, b) => b.score - a.score);
}
