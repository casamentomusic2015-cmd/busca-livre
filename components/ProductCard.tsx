import Image from 'next/image';
import { ExternalLink, Truck, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Produto } from '@/types/produto';

interface ProductCardProps {
  produto: Produto;
  onComparar?: (produto: Produto) => void;
}

const REPUTACAO_CONFIG = {
  platinum: { label: 'Platinum', className: 'bg-blue-500 text-white' },
  gold: { label: 'Gold', className: 'bg-yellow-400 text-black' },
  silver: { label: 'Silver', className: 'bg-gray-400 text-black' },
  bronze: { label: 'Bronze', className: 'bg-amber-700 text-white' },
  green: { label: 'Iniciante', className: 'bg-green-600 text-white' },
} as const;

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-sucesso' : score >= 40 ? 'bg-yellow-400' : 'bg-desconto';
  return (
    <div className="flex items-center gap-2" title={`Score: ${score}/100`}>
      <div className="flex-1 h-1.5 bg-borda rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] text-texto-muted font-mono">{score}</span>
    </div>
  );
}

export function ProductCard({ produto, onComparar }: ProductCardProps) {
  const rep = produto.vendedor.reputacao
    ? REPUTACAO_CONFIG[produto.vendedor.reputacao]
    : null;

  return (
    <article className="group bg-surface border border-borda rounded-xl overflow-hidden flex flex-col hover:border-acento/50 hover:scale-[1.02] transition-all duration-200">
      {/* Imagem */}
      <div className="relative aspect-square bg-[#1a1a1a]">
        <Image
          src={produto.imagem}
          alt={produto.titulo}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2"
          loading="lazy"
        />
        {produto.desconto_percentual && produto.desconto_percentual > 0 && (
          <span className="absolute top-2 left-2 bg-desconto text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{produto.desconto_percentual}%
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-texto text-xs leading-tight line-clamp-2 min-h-[2.5rem]">
          {produto.titulo}
        </p>

        {/* Preço */}
        <div>
          {produto.preco_original && produto.preco_original > produto.preco && (
            <p className="text-texto-muted text-[10px] line-through">
              {produto.preco_original.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
          <p className="text-acento text-base font-bold">
            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        {/* Frete + Avaliação */}
        <div className="flex items-center gap-2 flex-wrap">
          {produto.frete_gratis && (
            <span className="flex items-center gap-1 text-sucesso text-[10px] font-medium">
              <Truck className="w-3 h-3" aria-hidden="true" />
              Frete grátis
            </span>
          )}
          {produto.avaliacao && produto.avaliacao.total > 0 && (
            <span className="flex items-center gap-0.5 text-texto-muted text-[10px]">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {produto.avaliacao.media.toFixed(1)}
              <span className="text-[9px]">({produto.avaliacao.total})</span>
            </span>
          )}
        </div>

        {/* Vendedor */}
        <div className="flex items-center gap-1.5">
          <span className="text-texto-muted text-[10px] truncate flex-1">{produto.vendedor.nome}</span>
          {rep && (
            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', rep.className)}>
              {rep.label}
            </span>
          )}
        </div>

        {/* Score */}
        <ScoreBar score={produto.score} />

        {/* Ações */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <a
            href={produto.link_afiliado}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Ver oferta: ${produto.titulo}`}
            className="flex-1 flex items-center justify-center gap-1 bg-acento hover:bg-acento-hover text-black text-xs font-semibold py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-acento"
          >
            Ver oferta <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          {onComparar && (
            <button
              type="button"
              onClick={() => onComparar(produto)}
              aria-label={`Comparar preços de ${produto.titulo}`}
              className="px-2 py-2 border border-borda text-texto-muted hover:border-acento hover:text-acento text-xs rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-acento"
            >
              Comparar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
