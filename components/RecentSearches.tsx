'use client';

import { Clock, X, Trash2 } from 'lucide-react';
import type { BuscaRecente } from '@/types/produto';

interface RecentSearchesProps {
  buscas: BuscaRecente[];
  onSelecionar: (query: string) => void;
  onRemover: (query: string) => void;
  onLimpar: () => void;
}

export function RecentSearches({ buscas, onSelecionar, onRemover, onLimpar }: RecentSearchesProps) {
  if (buscas.length === 0) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-surface border border-borda rounded-xl shadow-xl z-30 overflow-hidden"
      role="listbox"
      aria-label="Buscas recentes"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-borda">
        <span className="text-texto-muted text-xs font-semibold uppercase tracking-wide">
          Buscas recentes
        </span>
        <button
          type="button"
          onClick={onLimpar}
          aria-label="Limpar histórico de buscas"
          className="flex items-center gap-1 text-texto-muted hover:text-desconto text-xs transition-colors focus-visible:outline-2 focus-visible:outline-acento rounded"
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
          Limpar
        </button>
      </div>

      <ul>
        {buscas.map((busca) => (
          <li key={busca.query} className="flex items-center group hover:bg-borda/50 transition-colors">
            <button
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => onSelecionar(busca.query)}
              className="flex items-center gap-3 flex-1 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-acento"
            >
              <Clock className="w-4 h-4 text-texto-muted shrink-0" aria-hidden="true" />
              <span className="text-texto text-sm">{busca.query}</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemover(busca.query); }}
              aria-label={`Remover busca: ${busca.query}`}
              className="px-3 py-3 text-texto-muted hover:text-desconto opacity-0 group-hover:opacity-100 transition-all focus-visible:outline-2 focus-visible:outline-acento rounded"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
