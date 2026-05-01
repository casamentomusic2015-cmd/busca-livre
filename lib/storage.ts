import type { BuscaRecente } from '@/types/produto';

const KEY_BUSCAS = 'busca-livre:buscas-recentes';
const KEY_TEMA = 'busca-livre:tema';
const KEY_BANNER = 'busca-livre:banner-fechado';
const MAX_BUSCAS = 8;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

// ----- Buscas recentes -----

export function getBuscasRecentes(): BuscaRecente[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(KEY_BUSCAS);
    return raw ? (JSON.parse(raw) as BuscaRecente[]) : [];
  } catch {
    return [];
  }
}

export function adicionarBusca(query: string): void {
  if (!isClient() || !query.trim()) return;
  const atual = getBuscasRecentes().filter((b) => b.query !== query.trim());
  const nova: BuscaRecente = { query: query.trim(), timestamp: Date.now() };
  const atualizado = [nova, ...atual].slice(0, MAX_BUSCAS);
  localStorage.setItem(KEY_BUSCAS, JSON.stringify(atualizado));
}

export function removerBusca(query: string): void {
  if (!isClient()) return;
  const atual = getBuscasRecentes().filter((b) => b.query !== query);
  localStorage.setItem(KEY_BUSCAS, JSON.stringify(atual));
}

export function limparBuscas(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEY_BUSCAS);
}

// ----- Tema -----

export type Tema = 'dark' | 'light';

export function getTema(): Tema {
  if (!isClient()) return 'dark';
  return (localStorage.getItem(KEY_TEMA) as Tema) ?? 'dark';
}

export function setTema(tema: Tema): void {
  if (!isClient()) return;
  localStorage.setItem(KEY_TEMA, tema);
}

// ----- Banner PWA -----

export function isBannerFechado(): boolean {
  if (!isClient()) return false;
  return localStorage.getItem(KEY_BANNER) === '1';
}

export function fecharBanner(): void {
  if (!isClient()) return;
  localStorage.setItem(KEY_BANNER, '1');
}
