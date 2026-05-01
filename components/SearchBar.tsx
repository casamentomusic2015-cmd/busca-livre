'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { VoiceSearch } from '@/components/VoiceSearch';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  onSearch: (q: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onVoiceError?: (msg: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  onFocus,
  onBlur,
  onVoiceError,
  placeholder = 'Buscar produtos no Mercado Livre…',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening, isSupported } = useVoiceSearch({
    lang: 'pt-BR',
    onResult: (text) => {
      onChange(text);
      onSearch(text);
    },
    onError: (err) => {
      const msgs: Record<string, string> = {
        'not-allowed': 'Permissão de microfone negada. Verifique as configurações do navegador.',
        'no-speech': 'Nenhuma fala detectada. Tente novamente.',
        'network': 'Erro de rede no reconhecimento de voz.',
      };
      onVoiceError?.(msgs[err] ?? 'Erro no reconhecimento de voz.');
    },
  });

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
      className="relative flex items-center gap-2 w-full"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-texto-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur ?? (() => {}), 150)}
          placeholder={placeholder}
          aria-label="Campo de busca"
          className={clsx(
            'w-full bg-surface border border-borda rounded-xl py-3 pl-10 pr-10 text-texto text-sm',
            'placeholder:text-texto-muted focus:outline-none focus:border-acento transition-colors',
            'focus-visible:ring-2 focus-visible:ring-acento/40'
          )}
        />
        {value && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-muted hover:text-texto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <VoiceSearch
        isListening={isListening}
        isSupported={isSupported}
        onStart={startListening}
        onStop={stopListening}
      />

      <button
        type="submit"
        aria-label="Buscar"
        className="hidden sm:flex items-center gap-2 px-4 py-3 bg-acento text-black font-semibold text-sm rounded-xl hover:bg-acento-hover transition-colors focus-visible:outline-2 focus-visible:outline-acento"
      >
        Buscar
      </button>
    </form>
  );
}
