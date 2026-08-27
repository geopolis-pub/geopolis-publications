export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/api/callback`;
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'repo');
  authorize.searchParams.set('state', state);

  const headers = new Headers({ Location: authorize.toString() });
  headers.append(
    'Set-Cookie',
    `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=600`
  );
  headers.set('Cache-Control', 'no-store');

  return new Response(null, { status: 302, headers });
}
