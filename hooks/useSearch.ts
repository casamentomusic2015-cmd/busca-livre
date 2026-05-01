'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Produto, FiltrosBusca, ResultadoBusca } from '@/types/produto';
import { adicionarBusca } from '@/lib/storage';
import { buscarDireto } from '@/lib/mlClientSearch';

const DEBOUNCE_MS = 500;

const filtrosIniciais: FiltrosBusca = {
  freteGratis: false,
  precoMin: undefined,
  precoMax: undefined,
  avaliacaoMinima: undefined,
  ordenacao: 'score',
};

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  resultados: Produto[];
  total: number;
  isLoading: boolean;
  erro: string | null;
  filtros: FiltrosBusca;
  setFiltros: (f: Partial<FiltrosBusca>) => void;
  buscar: (q: string) => void;
  recarregar: () => void;
}

export function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltrosState] = useState<FiltrosBusca>(filtrosIniciais);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const executarBusca = useCallback(
    async (termo: string, filtrosAtivos: FiltrosBusca) => {
      if (!termo.trim()) {
        setResultados([]);
        setTotal(0);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setErro(null);

      try {
        const params = new URLSearchParams({ q: termo, limit: '20' });
        if (filtrosAtivos.freteGratis) params.set('frete_gratis', 'true');
        if (filtrosAtivos.precoMin) params.set('min_price', String(filtrosAtivos.precoMin));
        if (filtrosAtivos.precoMax) params.set('max_price', String(filtrosAtivos.precoMax));
        if (filtrosAtivos.avaliacaoMinima) params.set('avaliacao_min', String(filtrosAtivos.avaliacaoMinima));
        params.set('sort', filtrosAtivos.ordenacao);

        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: abortRef.current.signal,
        });

        if (res.ok) {
          const data: ResultadoBusca = await res.json();
          setResultados(data.produtos);
          setTotal(data.total);
          adicionarBusca(termo);
          return;
        }

        // Verifica se o erro é bloqueio do ML (IP de servidor)
        const body = await res.json().catch(() => ({})) as { ml_blocked?: boolean };
        if (body.ml_blocked) {
          // Fallback: busca direta do browser (contorna o bloqueio de IP de servidor)
          const { produtos, total } = await buscarDireto(
            termo,
            20,
            filtrosAtivos,
            abortRef.current.signal
          );
          setResultados(produtos);
          setTotal(total);
          adicionarBusca(termo);
          return;
        }

        throw new Error(`Erro ${res.status}`);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setErro(err instanceof Error ? err.message : 'Erro ao buscar produtos');
        setResultados([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        executarBusca(q, filtros);
      }, DEBOUNCE_MS);
    },
    [filtros, executarBusca]
  );

  const buscar = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      executarBusca(q, filtros);
    },
    [filtros, executarBusca]
  );

  const setFiltros = useCallback(
    (novosFiltros: Partial<FiltrosBusca>) => {
      setFiltrosState((prev) => {
        const atualizado = { ...prev, ...novosFiltros };
        if (query.trim()) executarBusca(query, atualizado);
        return atualizado;
      });
    },
    [query, executarBusca]
  );

  const recarregar = useCallback(() => {
    executarBusca(query, filtros);
  }, [query, filtros, executarBusca]);

  useEffect(() => {
    return () => {
      debounceRef.current && clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { query, setQuery, resultados, total, isLoading, erro, filtros, setFiltros, buscar, recarregar };
}
