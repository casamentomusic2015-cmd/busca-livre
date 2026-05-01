'use client';

import { Mic, MicOff } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceSearchProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceSearch({ isListening, isSupported, onStart, onStop }: VoiceSearchProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      aria-label={isListening ? 'Parar gravação de voz' : 'Buscar por voz'}
      className={clsx(
        'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-acento',
        isListening
          ? 'bg-red-500 text-white'
          : 'bg-borda text-texto-muted hover:bg-acento hover:text-black'
      )}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
          <span className="absolute inset-[-4px] rounded-full border-2 border-red-400 animate-pulse" />
        </>
      )}
      {isListening ? (
        <MicOff className="w-4 h-4 relative z-10" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
