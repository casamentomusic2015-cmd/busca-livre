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

export interface BuscaRecente {
  query: string;
  timestamp: number;
}

export interface MLSearchResponse {
  results: MLProduto[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

export interface MLProduto {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  thumbnail: string;
  permalink: string;
  seller: {
    id: number;
    nickname: string;
    seller_reputation?: {
      level_id: string | null;
    };
  };
  shipping: {
    free_shipping: boolean;
  };
  reviews?: {
    rating_average: number;
    total: number;
  };
  condition: 'new' | 'used';
  installments?: {
    quantity: number;
    amount: number;
  };
}
