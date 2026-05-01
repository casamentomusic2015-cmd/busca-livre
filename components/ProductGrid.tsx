'use client';

import { useState, useEffect } from 'react';
import type { Produto } from '@/types/produto';
import { ProductCard } from '@/components/ProductCard';
import { PriceComparison } from '@/components/PriceComparison';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { SearchX, RefreshCw, WifiOff } from 'lucide-react';

interface ProductGridProps {
  produtos: Produto[];
  isLoading: boolean;
  erro: string | null;
  query: string;
  onRecarregar: () => void;
}

export function ProductGrid({ produtos, isLoading, erro, query, onRecarregar }: ProductGridProps) {
  const [comparando, setComparando] = useState<Produto | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isLoading) return <SkeletonGrid count={8} />;

  if (isOffline && !produtos.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <WifiOff className="w-12 h-12 text-texto-muted" aria-hidden="true" />
        <p className="text-texto font-semibold">Sem conexão</p>
        <p className="text-texto-muted text-sm max-w-xs">
          Verifique sua conexão com a internet. Suas buscas recentes ainda estão disponíveis.
        </p>
      </div>
    );
  }

  if (erro) {
    const isAuthError = erro.includes('autorização') || erro.includes('403');
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <SearchX className="w-12 h-12 text-texto-muted" aria-hidden="true" />
        <p className="text-texto font-semibold">
          {isAuthError ? 'Autorização necessária' : 'Erro ao carregar resultados'}
        </p>
        <p className="text-texto-muted text-sm max-w-sm">
          {isAuthError
            ? 'A API do Mercado Livre exige um token de usuário para pesquisas.'
            : erro}
        </p>
        {isAuthError ? (
          <a
            href="/auth"
            className="flex items-center gap-2 px-4 py-2 bg-acento text-black font-semibold text-sm rounded-lg hover:bg-acento-hover transition-colors"
          >
            Configurar autorização →
          </a>
        ) : (
          <button
            type="button"
            onClick={onRecarregar}
            className="flex items-center gap-2 px-4 py-2 bg-acento text-black font-semibold text-sm rounded-lg hover:bg-acento-hover transition-colors focus-visible:outline-2 focus-visible:outline-acento"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (query && !produtos.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <SearchX className="w-12 h-12 text-texto-muted" aria-hidden="true" />
        <p className="text-texto font-semibold">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        <div className="text-texto-muted text-sm space-y-1">
          <p>Sugestões:</p>
          <ul className="list-disc list-inside text-left inline-block">
            <li>Verifique a ortografia</li>
            <li>Use termos mais genéricos</li>
            <li>Remova alguns filtros</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-texto-muted text-sm">
          Digite um produto para buscar as melhores ofertas
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        aria-label={`${produtos.length} produtos encontrados para ${query}`}
      >
        {produtos.map((produto) => (
          <ProductCard key={produto.id} produto={produto} onComparar={setComparando} />
        ))}
      </div>

      {comparando && (
        <PriceComparison
          produto={comparando}
          onFechar={() => setComparando(null)}
        />
      )}
    </>
  );
}
