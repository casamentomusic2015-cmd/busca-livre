# Prompt para o Claude Code — App "Busca Livre"

## Contexto geral

Crie um Progressive Web App (PWA) completo chamado **Busca Livre**, um app de busca inteligente de produtos no Mercado Livre com busca por voz, comparação de preços, ranking de custo-benefício e monetização via links de afiliado.

O app deve ser **instalável no celular** (ícone na tela inicial, funciona como app nativo), ter **design moderno e responsivo**, e ser otimizado para uso mobile-first.

---

## Stack técnico

- **Framework**: Next.js 14 com App Router e TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **PWA**: next-pwa ou configuração manual com manifest + service worker
- **Deploy-ready**: Vercel (estrutura compatível)
- **Variáveis de ambiente**: `.env.local` para credenciais

---

## Estrutura de pastas esperada

```
busca-livre/
├── app/
│   ├── layout.tsx              # layout raiz com manifest e meta tags PWA
│   ├── page.tsx                # tela principal
│   ├── produto/[id]/page.tsx   # página de detalhe do produto
│   └── api/
│       ├── search/route.ts     # proxy de busca na API do ML
│       └── product/[id]/route.ts # detalhe de produto
├── components/
│   ├── VoiceSearch.tsx         # botão de voz com feedback visual
│   ├── SearchBar.tsx           # barra de busca texto + voz
│   ├── ProductCard.tsx         # card de produto com link afiliado
│   ├── ProductGrid.tsx         # grid de resultados
│   ├── PriceComparison.tsx     # comparação dos melhores preços
│   ├── FilterBar.tsx           # filtros: frete grátis, avaliação, preço
│   ├── RecentSearches.tsx      # histórico de buscas (localStorage)
│   ├── SkeletonCard.tsx        # skeleton loading
│   └── InstallBanner.tsx       # banner "instalar app"
├── lib/
│   ├── mercadolivre.ts         # funções de chamada à API do ML
│   ├── affiliate.ts            # função de geração de links afiliados
│   ├── ranking.ts              # algoritmo de score dos produtos
│   └── storage.ts              # utilitários de localStorage
├── hooks/
│   ├── useVoiceSearch.ts       # hook para Web Speech API
│   ├── usePWAInstall.ts        # hook para prompt de instalação
│   └── useSearch.ts            # hook principal de busca com debounce
├── types/
│   └── produto.ts              # tipagens TypeScript
├── public/
│   ├── manifest.json           # config PWA
│   ├── sw.js                   # service worker
│   ├── icon-192.png            # ícone PWA 192x192
│   └── icon-512.png            # ícone PWA 512x512
└── .env.local.example          # exemplo de variáveis de ambiente
```

---

## Funcionalidades obrigatórias

### 1. Busca por voz
- Botão de microfone visível na barra de busca
- Usa `Web Speech API` nativa com `lang: 'pt-BR'`
- Feedback visual animado enquanto escuta (ondas de áudio ou pulsação)
- Fallback gracioso para browsers sem suporte (esconde o botão, não quebra)
- Ao reconhecer o texto, dispara a busca automaticamente

```typescript
// hooks/useVoiceSearch.ts — comportamento esperado
const { isListening, transcript, startListening, isSupported } = useVoiceSearch({
  lang: 'pt-BR',
  onResult: (text) => handleSearch(text),
  onError: (err) => console.warn('Voz indisponível:', err),
});
```

### 2. Busca com debounce e sugestões
- Debounce de 500ms na busca por texto
- Exibe buscas recentes (salvas no localStorage, máximo 8)
- Sugestões aparecem num dropdown ao digitar

### 3. Proxy seguro para API do Mercado Livre

```typescript
// app/api/search/route.ts
// GET /api/search?q=TERMO&limit=20&sort=price_asc&frete_gratis=true
// Chama: https://api.mercadolibre.com/sites/MLB/search?q=...
// Injeta tracking_id em todos os permalinks antes de retornar
```

Parâmetros suportados no proxy:
- `q` — termo de busca
- `limit` — quantidade de resultados (padrão: 20)
- `sort` — `price_asc`, `price_desc`, `relevance`, `score` (score = algoritmo próprio)
- `frete_gratis` — boolean
- `min_price` / `max_price` — faixa de preço

### 4. Algoritmo de ranking (lib/ranking.ts)

Crie uma função `calcularScore(produto)` que gera uma pontuação 0–100 para cada produto baseada em:

| Critério | Peso |
|---|---|
| Preço (menor = melhor, normalizado) | 35% |
| Reputação do vendedor | 25% |
| Frete grátis | 20% |
| Avaliação e quantidade de reviews | 15% |
| Produto novo (não recondicionado) | 5% |

O resultado padrão da busca deve ordenar pelo score. O usuário pode trocar o critério.

### 5. Links de afiliado (lib/affiliate.ts)

```typescript
// Variável de ambiente: ML_TRACKING_ID
export function gerarLinkAfiliado(permalink: string): string {
  const trackingId = process.env.ML_TRACKING_ID;
  if (!trackingId || !permalink) return permalink;
  const url = new URL(permalink);
  url.searchParams.set('tracking_id', trackingId);
  return url.toString();
}
```

**Importante**: essa função deve ser chamada **apenas no servidor** (API routes), nunca exposta ao cliente.

### 6. Card de produto (components/ProductCard.tsx)

Cada card deve exibir:
- Imagem do produto (com lazy loading)
- Título (truncado em 2 linhas)
- Preço atual em destaque
- Preço original riscado (se houver desconto)
- Badge de desconto em % (ex: `-23%`)
- Indicador de frete grátis
- Nome e reputação do vendedor (estrelas ou badge colorido por nível)
- Score do produto (barra de progresso visual ou badge)
- Botão "Ver oferta" com o link de afiliado (abre em nova aba)

### 7. Comparação de preços (components/PriceComparison.tsx)

Ao clicar em "Comparar preços" num produto, exibe um modal ou painel com:
- Top 5 ofertas do mesmo produto ordenadas por preço
- Diferença de preço entre a mais barata e a mais cara
- Destaque visual na melhor oferta
- Links afiliados para cada uma

### 8. Filtros e ordenação (components/FilterBar.tsx)

- Toggle "Frete grátis"
- Slider de faixa de preço (R$ mín — R$ máx)
- Filtro de avaliação mínima (1–5 estrelas)
- Ordenação: Relevância / Menor preço / Maior desconto / Melhor score
- Chips dos filtros ativos com botão de remover

### 9. Histórico de buscas recentes

- Salvo no `localStorage` com timestamp
- Exibido abaixo da barra ao focar nela (quando campo vazio)
- Ícone de relógio, texto da busca, botão de remover individualmente
- Botão "Limpar histórico"

### 10. PWA — instalável no celular

**public/manifest.json**:
```json
{
  "name": "Busca Livre",
  "short_name": "Busca Livre",
  "description": "Busca inteligente no Mercado Livre com voz e comparação de preços",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#FFE600",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Service worker (public/sw.js)**: cache de assets estáticos, fallback offline com página simples "Sem conexão — suas buscas recentes ainda estão disponíveis".

**Banner de instalação (components/InstallBanner.tsx)**:
- Detecta o evento `beforeinstallprompt`
- Exibe um banner fixo na parte inferior na primeira visita
- Botão "Instalar app" dispara o prompt nativo
- Botão fechar salva no localStorage para não mostrar de novo

### 11. Skeleton loading

Enquanto os resultados carregam, exibir `SkeletonCard` animados (shimmer effect) no lugar dos cards reais. Mínimo 6 skeletons visíveis.

### 12. Tratamento de erros e estados vazios

- Erro de API: mensagem amigável + botão de tentar novamente
- Sem resultados: ilustração + sugestões de buscas alternativas
- Sem conexão: aviso com buscas recentes disponíveis offline
- Erro de voz: toast explicando que o microfone não foi autorizado

---

## Design e UI

**Tema**: Dark mode como padrão, com opção de light mode (salvo no localStorage).

**Paleta**:
```css
--cor-fundo: #0a0a0a
--cor-surface: #141414
--cor-borda: #2a2a2a
--cor-acento: #FFE600        /* amarelo Mercado Livre */
--cor-acento-hover: #FFD000
--cor-texto: #f5f5f5
--cor-texto-muted: #888888
--cor-sucesso: #00C851        /* frete grátis */
--cor-desconto: #FF4444       /* badge de desconto */
```

**Tipografia**: Use `Sora` (Google Fonts) para títulos e `Inter` para corpo.

**Mobile-first**: Layout responsivo. Em mobile, filtros ficam num drawer deslizante de baixo. Em desktop, sidebar lateral.

**Micro-interações**:
- Cards com hover scale sutil (1.02)
- Botão de voz com animação de pulso quando ativo
- Transição suave ao aplicar/remover filtros
- Toast de confirmação ao copiar link

---

## Variáveis de ambiente

Crie o arquivo `.env.local.example` com:

```bash
# Tracking ID do programa de afiliados do Mercado Livre
ML_TRACKING_ID=seu_tracking_id_aqui

# Opcional: token de acesso à API do ML (para endpoints autenticados)
ML_ACCESS_TOKEN=

# URL base do app (usado para meta tags)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Tipagens TypeScript (types/produto.ts)

```typescript
export interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original?: number;
  desconto_percentual?: number;
  imagem: string;
  link_afiliado: string;
  permalink: string;
  vendedor: {
    id: number;
    nome: string;
    reputacao: 'platinum' | 'gold' | 'silver' | 'bronze' | 'green' | null;
  };
  frete_gratis: boolean;
  avaliacao?: {
    media: number;
    total: number;
  };
  condicao: 'new' | 'used';
  score: number; // 0-100, calculado pelo algoritmo de ranking
}

export interface FiltrosBusca {
  freteGratis: boolean;
  precoMin?: number;
  precoMax?: number;
  avaliacaoMinima?: number;
  ordenacao: 'relevance' | 'price_asc' | 'price_desc' | 'score' | 'discount';
}

export interface ResultadoBusca {
  produtos: Produto[];
  total: number;
  query: string;
  tempoMs: number;
}
```

---

## SEO e meta tags

No `app/layout.tsx`, incluir meta tags para PWA e compartilhamento:

```html
<meta name="application-name" content="Busca Livre" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Busca Livre" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#FFE600" />
<link rel="manifest" href="/manifest.json" />
```

---

## README.md

Gere um README completo com:
1. Descrição do projeto
2. Funcionalidades
3. Como rodar localmente (pré-requisitos, clone, install, configurar `.env.local`, `npm run dev`)
4. Como fazer deploy na Vercel
5. Como obter o `tracking_id` no programa de afiliados do ML
6. Estrutura de pastas explicada
7. Como personalizar o algoritmo de score

---

## Instruções de execução para o Claude Code

1. Criar o projeto com `npx create-next-app@latest busca-livre --typescript --tailwind --app --src-dir=false`
2. Instalar dependências adicionais: `lucide-react`, `clsx`
3. Implementar todos os arquivos na ordem: tipos → lib → hooks → components → app → public
4. Ao final, rodar `npm run build` para verificar que não há erros de TypeScript ou build
5. Gerar ícones placeholder (192x192 e 512x512) em SVG caso não haja PNGs reais
6. Criar o `.env.local.example` mas NÃO criar o `.env.local` real (usuário deve preencher)
7. Ao terminar, exibir um resumo do que foi criado e os próximos passos para o usuário

---

## Critérios de qualidade

- Zero erros de TypeScript (`strict: true`)
- Zero warnings no build do Next.js
- Lighthouse PWA score ≥ 90
- Funciona offline (ao menos exibe histórico e mensagem de erro)
- Responsivo de 320px a 1440px
- Acessível: botões com aria-label, imagens com alt, foco visível no teclado
- Sem chaves de API expostas no bundle do cliente
