import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, ArrowLeft, Star, Truck, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { buscarDetalhe, mlProdutoToProduto } from '@/lib/mercadolivre';
import { gerarLinkAfiliado } from '@/lib/affiliate';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const produto = await buscarDetalhe(id);
    return {
      title: `${produto.title} — Busca Livre`,
      description: `Compre ${produto.title} no Mercado Livre com o melhor preço.`,
    };
  } catch {
    return { title: 'Produto — Busca Livre' };
  }
}

export default async function ProdutoPage({ params }: PageProps) {
  const { id } = await params;

  let produto;
  try {
    produto = await buscarDetalhe(id);
  } catch {
    notFound();
  }

  const detalhado = mlProdutoToProduto(produto);
  const linkAfiliado = gerarLinkAfiliado(produto.permalink);

  return (
    <div className="min-h-screen bg-fundo">
      <header className="sticky top-0 z-20 bg-fundo/95 backdrop-blur border-b border-borda px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-texto-muted hover:text-texto text-sm transition-colors focus-visible:outline-2 focus-visible:outline-acento rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar à busca
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagem */}
          <div className="relative aspect-square bg-surface rounded-2xl border border-borda overflow-hidden">
            <Image
              src={detalhado.imagem}
              alt={detalhado.titulo}
              fill
              priority
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <div>
              {detalhado.condicao === 'new' ? (
                <span className="text-texto-muted text-xs">Produto Novo</span>
              ) : (
                <span className="text-yellow-400 text-xs">Produto Usado</span>
              )}
              <h1 className="text-texto text-xl font-bold mt-1 leading-snug">{detalhado.titulo}</h1>
            </div>

            {detalhado.avaliacao && detalhado.avaliacao.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${n <= Math.round(detalhado.avaliacao!.media) ? 'fill-yellow-400 text-yellow-400' : 'text-borda'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-texto-muted text-sm">
                  {detalhado.avaliacao.media.toFixed(1)} ({detalhado.avaliacao.total} avaliações)
                </span>
              </div>
            )}

            {/* Preço */}
            <div>
              {detalhado.preco_original && detalhado.preco_original > detalhado.preco && (
                <p className="text-texto-muted text-sm line-through">
                  {detalhado.preco_original.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
              <p className="text-acento text-3xl font-bold">
                {detalhado.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              {detalhado.desconto_percentual && detalhado.desconto_percentual > 0 && (
                <span className="inline-block mt-1 bg-desconto text-white text-xs font-bold px-2 py-0.5 rounded">
                  -{detalhado.desconto_percentual}% de desconto
                </span>
              )}
            </div>

            {/* Frete + Vendedor */}
            <div className="flex flex-col gap-2 p-4 bg-surface border border-borda rounded-xl">
              {detalhado.frete_gratis && (
                <div className="flex items-center gap-2 text-sucesso text-sm">
                  <Truck className="w-4 h-4" aria-hidden="true" />
                  Frete grátis
                </div>
              )}
              <div className="flex items-center gap-2 text-texto-muted text-sm">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Vendido por{' '}
                <span className="text-texto font-medium">{detalhado.vendedor.nome}</span>
              </div>
            </div>

            <a
              href={linkAfiliado}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={`Comprar ${detalhado.titulo} no Mercado Livre`}
              className="flex items-center justify-center gap-2 w-full py-4 bg-acento hover:bg-acento-hover text-black font-bold rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-acento text-base"
            >
              Comprar no Mercado Livre
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>

            <p className="text-texto-muted text-xs text-center">
              Você será redirecionado ao Mercado Livre. Preços e disponibilidade podem variar.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
