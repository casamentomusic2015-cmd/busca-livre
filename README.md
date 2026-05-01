# Busca Livre

PWA de busca inteligente de produtos no Mercado Livre com busca por voz, comparação de preços e ranking de custo-benefício.

## Funcionalidades

- **Busca por voz** — Web Speech API nativa em pt-BR
- **Algoritmo de score** — ranking 0-100 por preço, reputação do vendedor, frete grátis, avaliação e condição
- **Comparação de preços** — top 5 ofertas do mesmo produto em modal
- **Filtros avançados** — frete grátis, faixa de preço, avaliação mínima, ordenação
- **Histórico de buscas** — localStorage, máximo 8 buscas recentes
- **PWA instalável** — funciona offline, ícone na tela inicial
- **Links de afiliado** — tracking_id injetado no servidor (nunca exposto ao cliente)
- **Dark mode** — padrão escuro com paleta amarela do Mercado Livre
- **Acessível** — aria-labels, foco visível, responsivo 320px–1440px

## Pré-requisitos

- Node.js 18+
- npm 9+

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone <url-do-repo> busca-livre
cd busca-livre

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local e preencha ML_TRACKING_ID

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ML_TRACKING_ID` | Sim (para afiliados) | Tracking ID do programa de afiliados |
| `ML_ACCESS_TOKEN` | Não | Token OAuth do ML (endpoints autenticados) |
| `NEXT_PUBLIC_APP_URL` | Não | URL do app em produção |

## Como obter o Tracking ID do ML

1. Acesse [Mercado Livre Afiliados](https://www.mercadolivre.com.br/afiliados)
2. Crie uma conta de afiliado
3. Gere seu `tracking_id` no painel
4. Adicione ao `.env.local` como `ML_TRACKING_ID=seu_id`

## Deploy na Vercel

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no painel da Vercel:
# Settings > Environment Variables > adicione ML_TRACKING_ID etc.
```

Ou conecte o repositório no [vercel.com](https://vercel.com) via GitHub e configure as variáveis pelo painel.

## Estrutura de pastas

```
busca-livre/
├── app/
│   ├── layout.tsx              # Layout raiz: fontes, PWA meta tags, SW register
│   ├── page.tsx                # Tela principal: busca + filtros + grid
│   ├── globals.css             # Design tokens Tailwind v4 + estilos base
│   ├── produto/[id]/page.tsx   # Página de detalhe do produto (SSR)
│   └── api/
│       ├── search/route.ts     # Proxy de busca na API do ML (GET)
│       └── product/[id]/route.ts # Detalhe de produto (GET)
├── components/
│   ├── VoiceSearch.tsx         # Botão de microfone com animação
│   ├── SearchBar.tsx           # Campo de busca com voz integrada
│   ├── ProductCard.tsx         # Card com imagem, preço, score, link afiliado
│   ├── ProductGrid.tsx         # Grid responsivo + estados de erro/vazio/offline
│   ├── PriceComparison.tsx     # Modal de comparação de preços (top 5)
│   ├── FilterBar.tsx           # Filtros desktop (sidebar) e mobile (drawer)
│   ├── RecentSearches.tsx      # Dropdown de histórico de buscas
│   ├── SkeletonCard.tsx        # Skeleton shimmer loading
│   ├── InstallBanner.tsx       # Banner de instalação PWA
│   └── ServiceWorkerRegister.tsx # Registro do SW no cliente
├── lib/
│   ├── mercadolivre.ts         # Chamadas à API do ML + mapeamento de tipos
│   ├── affiliate.ts            # Geração de links de afiliado (server-only)
│   ├── ranking.ts              # Algoritmo de score 0-100
│   └── storage.ts              # Utilitários de localStorage
├── hooks/
│   ├── useVoiceSearch.ts       # Web Speech API
│   ├── usePWAInstall.ts        # beforeinstallprompt
│   └── useSearch.ts            # Busca com debounce + filtros + abort
├── types/
│   └── produto.ts              # Tipos TypeScript compartilhados
└── public/
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service worker (cache + offline)
    ├── icon-192.svg            # Ícone placeholder 192x192
    └── icon-512.svg            # Ícone placeholder 512x512
```

## Algoritmo de score

O score é calculado em `lib/ranking.ts` pela função `calcularScores(produtos)`:

| Critério | Peso | Como é calculado |
|---|---|---|
| Preço | 35% | Normalizado: menor preço do conjunto = 100 pontos |
| Reputação do vendedor | 25% | Platinum=100, Gold=80, Silver=60, Bronze=40, Green=20 |
| Frete grátis | 20% | Sim=100, Não=0 |
| Avaliação | 15% | 70% da média (0-5★) + 30% do volume (cap. 100 reviews) |
| Condição | 5% | Novo=100, Usado=0 |

Para personalizar, edite os pesos em `lib/ranking.ts`:

```typescript
const PESOS = {
  preco: 0.35,      // ajuste aqui
  reputacao: 0.25,
  frete: 0.20,
  avaliacao: 0.15,
  condicao: 0.05,
};
```

## Ícones PWA

Os ícones `icon-192.svg` e `icon-512.svg` são placeholders. Para publicar o app com ícones reais:

1. Crie PNGs 192x192 e 512x512 com seu logo
2. Coloque em `public/icon-192.png` e `public/icon-512.png`
3. Atualize `public/manifest.json` para referenciar os PNGs com `"type": "image/png"`
