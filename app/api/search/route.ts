import { NextRequest, NextResponse } from 'next/server';
import { buscarProdutos } from '@/lib/mercadolivre';
import type { FiltrosBusca, ResultadoBusca } from '@/types/produto';

export const runtime = 'nodejs';

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

  console.log(`[API /search] query="${q}" limit=${limit} sort=${filtros.ordenacao}`);

  try {
    const { produtos, total } = await buscarProdutos({ q, limit, filtros });

    const tempoMs = Date.now() - inicio;
    console.log(`[API /search] ✓ ${produtos.length} produtos em ${tempoMs}ms (total ML: ${total})`);

    const resultado: ResultadoBusca = { produtos, total, query: q, tempoMs };

    return NextResponse.json(resultado, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    const tempoMs = Date.now() - inicio;
    const msg = err instanceof Error ? err.message : String(err);
    const mlBlocked = msg.includes('autorização') || msg.includes('403');
    console.error(`[API /search] ✗ erro após ${tempoMs}ms (ml_blocked=${mlBlocked}):`, msg);
    return NextResponse.json(
      { error: msg, ml_blocked: mlBlocked },
      { status: 502 }
    );
  }
}
