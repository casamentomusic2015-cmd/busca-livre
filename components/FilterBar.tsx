'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { FiltrosBusca } from '@/types/produto';

interface FilterBarProps {
  filtros: FiltrosBusca;
  onChange: (f: Partial<FiltrosBusca>) => void;
}

const ORDENACOES: { value: FiltrosBusca['ordenacao']; label: string }[] = [
  { value: 'score', label: 'Melhor score' },
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'discount', label: 'Maior desconto' },
];

const ESTRELAS = [1, 2, 3, 4, 5] as const;

export function FilterBar({ filtros, onChange }: FilterBarProps) {
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [precoMinInput, setPrecoMinInput] = useState(String(filtros.precoMin ?? ''));
  const [precoMaxInput, setPrecoMaxInput] = useState(String(filtros.precoMax ?? ''));

  const aplicarPreco = () => {
    onChange({
      precoMin: precoMinInput ? Number(precoMinInput) : undefined,
      precoMax: precoMaxInput ? Number(precoMaxInput) : undefined,
    });
  };

  const filtrosAtivos: string[] = [];
  if (filtros.freteGratis) filtrosAtivos.push('Frete grátis');
  if (filtros.precoMin || filtros.precoMax) {
    const min = filtros.precoMin ? `R$${filtros.precoMin}` : '*';
    const max = filtros.precoMax ? `R$${filtros.precoMax}` : '*';
    filtrosAtivos.push(`Preço: ${min}–${max}`);
  }
  if (filtros.avaliacaoMinima) filtrosAtivos.push(`≥ ${filtros.avaliacaoMinima}★`);

  const PainelFiltros = () => (
    <div className="space-y-5 p-4">
      {/* Ordenação */}
      <div>
        <p className="text-texto-muted text-xs font-semibold uppercase tracking-wide mb-2">Ordenar por</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1">
          {ORDENACOES.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => onChange({ ordenacao: op.value })}
              className={clsx(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-acento',
                filtros.ordenacao === op.value
                  ? 'bg-acento text-black font-semibold'
                  : 'bg-borda text-texto hover:bg-borda/60'
              )}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frete grátis */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.freteGratis}
            onChange={(e) => onChange({ freteGratis: e.target.checked })}
            className="w-4 h-4 rounded accent-acento"
            aria-label="Apenas frete grátis"
          />
          <span className="text-texto text-sm">Apenas frete grátis</span>
        </label>
      </div>

      {/* Faixa de preço */}
      <div>
        <p className="text-texto-muted text-xs font-semibold uppercase tracking-wide mb-2">Faixa de preço</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={precoMinInput}
            onChange={(e) => setPrecoMinInput(e.target.value)}
            onBlur={aplicarPreco}
            aria-label="Preço mínimo"
            className="flex-1 bg-borda border border-borda rounded-lg px-3 py-2 text-texto text-sm focus:outline-none focus:border-acento"
          />
          <span className="text-texto-muted">–</span>
          <input
            type="number"
            placeholder="Máx"
            value={precoMaxInput}
            onChange={(e) => setPrecoMaxInput(e.target.value)}
            onBlur={aplicarPreco}
            aria-label="Preço máximo"
            className="flex-1 bg-borda border border-borda rounded-lg px-3 py-2 text-texto text-sm focus:outline-none focus:border-acento"
          />
        </div>
      </div>

      {/* Avaliação mínima */}
      <div>
        <p className="text-texto-muted text-xs font-semibold uppercase tracking-wide mb-2">Avaliação mínima</p>
        <div className="flex gap-1.5">
          {ESTRELAS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                onChange({ avaliacaoMinima: filtros.avaliacaoMinima === n ? undefined : n })
              }
              aria-label={`Avaliação mínima: ${n} estrela${n > 1 ? 's' : ''}`}
              aria-pressed={filtros.avaliacaoMinima === n}
              className={clsx(
                'flex-1 py-2 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-acento',
                filtros.avaliacaoMinima === n
                  ? 'bg-yellow-400 text-black font-bold'
                  : 'bg-borda text-texto-muted hover:bg-borda/60'
              )}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>

      {/* Botão limpar */}
      {filtrosAtivos.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setPrecoMinInput('');
            setPrecoMaxInput('');
            onChange({ freteGratis: false, precoMin: undefined, precoMax: undefined, avaliacaoMinima: undefined });
          }}
          className="w-full py-2 border border-borda text-texto-muted text-sm rounded-lg hover:border-desconto hover:text-desconto transition-colors focus-visible:outline-2 focus-visible:outline-acento"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop — sidebar integrada (renderizada pelo layout pai) */}
      <div className="hidden lg:block">
        <PainelFiltros />
      </div>

      {/* Mobile — botão + drawer */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            aria-label="Abrir filtros"
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-borda rounded-lg text-texto text-sm hover:border-acento transition-colors focus-visible:outline-2 focus-visible:outline-acento"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filtros
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </button>

          {/* Chips de filtros ativos */}
          {filtrosAtivos.map((chip) => (
            <span
              key={chip}
              className="flex items-center gap-1 px-2 py-1 bg-acento/10 border border-acento/30 text-acento text-xs rounded-full"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Drawer */}
        {drawerAberto && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerAberto(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 bg-surface border-t border-borda rounded-t-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <p className="text-texto font-semibold">Filtros</p>
                <button
                  type="button"
                  onClick={() => setDrawerAberto(false)}
                  aria-label="Fechar filtros"
                  className="text-texto-muted hover:text-texto focus-visible:outline-2 focus-visible:outline-acento rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <PainelFiltros />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
