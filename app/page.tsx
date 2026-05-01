'use client';

import { useState, useCallback } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { ProductGrid } from '@/components/ProductGrid';
import { RecentSearches } from '@/components/RecentSearches';
import { InstallBanner } from '@/components/InstallBanner';
import { useSearch } from '@/hooks/useSearch';
import {
  getBuscasRecentes,
  removerBusca,
  limparBuscas,
} from '@/lib/storage';
import { Zap } from 'lucide-react';

export default function Home() {
  const { query, setQuery, buscar, resultados, total, isLoading, erro, filtros, setFiltros, recarregar } =
    useSearch();
  const [mostrarRecentes, setMostrarRecentes] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const buscasRecentes = getBuscasRecentes();

  const exibirToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSelecionarRecente = (q: string) => {
    setMostrarRecentes(false);
    buscar(q);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/95 backdrop-blur border-b border-borda">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Busca Livre — página inicial" className="shrink-0">
              <div className="flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-acento" aria-hidden="true" />
                <span className="font-bold text-texto text-lg leading-none">
                  Busca<span className="text-acento">Livre</span>
                </span>
              </div>
            </a>

            <div className="flex-1 relative">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={(q) => { buscar(q); setMostrarRecentes(false); }}
                onFocus={() => { if (!query) setMostrarRecentes(true); }}
                onBlur={() => setMostrarRecentes(false)}
                onVoiceError={exibirToast}
              />
              {mostrarRecentes && (
                <RecentSearches
                  buscas={buscasRecentes}
                  onSelecionar={handleSelecionarRecente}
                  onRemover={removerBusca}
                  onLimpar={limparBuscas}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Resultados */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {resultados.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-texto-muted text-sm">
              <span className="text-texto font-semibold">{total.toLocaleString('pt-BR')}</span>{' '}
              resultados para{' '}
              <span className="text-acento">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar de filtros (desktop) */}
          {(resultados.length > 0 || isLoading) && (
            <aside className="hidden lg:block w-56 shrink-0" aria-label="Filtros de busca">
              <FilterBar filtros={filtros} onChange={setFiltros} />
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {/* Filtros mobile */}
            {(resultados.length > 0 || isLoading) && (
              <div className="lg:hidden mb-4">
                <FilterBar filtros={filtros} onChange={setFiltros} />
              </div>
            )}

            <ProductGrid
              produtos={resultados}
              isLoading={isLoading}
              erro={erro}
              query={query}
              onRecarregar={recarregar}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-borda py-4 px-4 text-center">
        <p className="text-texto-muted text-xs">
          Busca Livre usa links de afiliado — você não paga nada extra por isso.
        </p>
      </footer>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-surface border border-borda text-texto text-sm px-4 py-3 rounded-xl shadow-xl z-50 max-w-xs text-center"
        >
          {toast}
        </div>
      )}

      <InstallBanner />
    </div>
  );
}
