'use client';

import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBanner() {
  const { canInstall, showBanner, install, dismissBanner } = usePWAInstall();

  if (!showBanner || !canInstall) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 bg-surface border border-acento/40 rounded-2xl shadow-2xl p-4 flex items-center gap-3"
      role="banner"
      aria-label="Instalar app Busca Livre"
    >
      <div className="w-10 h-10 bg-acento rounded-xl flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-black" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-texto text-sm font-semibold">Instalar app</p>
        <p className="text-texto-muted text-xs">Acesso rápido na tela inicial</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="px-3 py-1.5 bg-acento hover:bg-acento-hover text-black text-xs font-bold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-acento"
        aria-label="Instalar Busca Livre"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Fechar banner de instalação"
        className="text-texto-muted hover:text-texto transition-colors focus-visible:outline-2 focus-visible:outline-acento rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
