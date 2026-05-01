/**
 * Gera link de afiliado para um produto do Mercado Livre.
 * IMPORTANTE: usar apenas no servidor (API routes) — nunca expor ao cliente.
 */
export function gerarLinkAfiliado(permalink: string): string {
  const trackingId = process.env.ML_TRACKING_ID;
  if (!trackingId || !permalink) return permalink;
  try {
    const url = new URL(permalink);
    url.searchParams.set('tracking_id', trackingId);
    return url.toString();
  } catch {
    return permalink;
  }
}
