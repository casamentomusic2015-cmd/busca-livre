import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/** Endpoint de DEBUG — mostra se há tokens salvos nos cookies (não expõe os valores). */
export async function GET() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('ml_access_token')?.value;
  const refreshToken = cookieStore.get('ml_refresh_token')?.value;

  return NextResponse.json({
    has_access_token: !!accessToken,
    has_refresh_token: !!refreshToken,
    // Mostra prefixo do token apenas para confirmar que é o formato correto (APP_USR-...)
    access_token_prefix: accessToken ? accessToken.slice(0, 20) + '...' : null,
    refresh_token_prefix: refreshToken ? refreshToken.slice(0, 20) + '...' : null,
  });
}
