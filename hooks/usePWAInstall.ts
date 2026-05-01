'use client';

import { useState, useEffect } from 'react';
import { isBannerFechado, fecharBanner } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  showBanner: boolean;
  install: () => Promise<void>;
  dismissBanner: () => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      if (!isBannerFechado()) setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissBanner = (): void => {
    fecharBanner();
    setShowBanner(false);
  };

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    showBanner,
    install,
    dismissBanner,
  };
}
