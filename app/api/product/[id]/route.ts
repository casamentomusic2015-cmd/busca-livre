import { NextRequest, NextResponse } from 'next/server';
import { buscarDetalhe, mlProdutoToProduto } from '@/lib/mercadolivre';
import { calcularScore } from '@/lib/ranking';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^MLB\d+$/i.test(id)) {
    return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
  }

  try {
    const mlProduto = await buscarDetalhe(id);
    const produto = mlProdutoToProduto(mlProduto);
    produto.score = calcularScore(produto);

    return NextResponse.json(produto, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[API /product]', err);
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }
}
