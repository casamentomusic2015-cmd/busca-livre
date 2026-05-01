'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ExternalLink, Truck, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import type { Produto, ResultadoBusca } from '@/types/produto';

interface PriceComparisonProps {
  produto: Produto;
  onFechar: () => void;
}

export function PriceComparison({ produto, onFechar }: PriceComparisonProps) {
  const [ofertas, setOfertas] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        // Remove marca/palavras genéricas para buscar variações do mesmo produto
        const termoCurto = produto.titulo.split(' ').slice(0, 5).join(' ');
        const res = await fetch(`/api/search?q=${encodeURIComponent(termoCurto)}&limit=5&sort=price_asc`);
        if (!res.ok) throw new Error('Erro ao buscar comparações');
        const data: ResultadoBusca = await res.json();
        setOfertas(data.produtos.slice(0, 5));
      } catch {
        setOfertas([]);
      } finally {
        setIsLoading(false);
      }
    };
    buscar();
  }, [produto.titulo]);

  const precoMin = ofertas.length ? Math.min(...ofertas.map((o) => o.preco)) : 0;
  const precoMax = ofertas.length ? Math.max(...ofertas.map((o) => o.preco)) : 0;
  const diferenca = precoMax - precoMin;

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Comparação de preços"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="bg-surface border border-borda rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-borda">
          <div className="w-12 h-12 relative shrink-0 bg-[#1a1a1a] rounded-lg overflow-hidden">
            <Image src={produto.imagem} alt={produto.titulo} fill className="object-contain p-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-texto text-sm font-semibold line-clamp-2">{produto.titulo}</p>
            {diferenca > 0 && (
              <p className="text-texto-muted text-xs mt-1">
                Diferença de{' '}
                <span className="text-sucesso font-bold">
                  {diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>{' '}
                entre a mais barata e a mais cara
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar comparação"
            className="text-texto-muted hover:text-texto shrink-0 focus-visible:outline-2 focus-visible:outline-acento rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista */}
        <div className="p-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-borda rounded-lg animate-pulse" />
            ))
          ) : ofertas.length === 0 ? (
            <p className="text-texto-muted text-sm text-center py-4">
              Não foi possível carregar comparações.
            </p>
          ) : (
            ofertas.map((oferta, i) => {
              const isBest = oferta.preco === precoMin;
              return (
                <div
                  key={oferta.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                    isBest ? 'border-sucesso/50 bg-sucesso/5' : 'border-borda'
                  )}
                >
                  {isBest && <Trophy className="w-4 h-4 text-sucesso shrink-0" aria-label="Melhor oferta" />}
                  {!isBest && <span className="w-4 h-4 text-texto-muted text-xs text-center shrink-0">{i + 1}°</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-texto text-xs line-clamp-1">{oferta.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx('text-sm font-bold', isBest ? 'text-sucesso' : 'text-acento')}>
                        {oferta.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {oferta.frete_gratis && (
                        <span className="flex items-center gap-0.5 text-sucesso text-[10px]">
                          <Truck className="w-3 h-3" aria-hidden="true" /> Grátis
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={oferta.link_afiliado}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    aria-label={`Ver oferta de ${oferta.titulo}`}
                    className="shrink-0 p-2 border border-borda rounded-lg text-texto-muted hover:border-acento hover:text-acento transition-colors focus-visible:outline-2 focus-visible:outline-acento"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
