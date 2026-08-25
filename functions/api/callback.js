function html(message) {
  return new Response(`<!doctype html><html><body><script>window.opener && window.opener.postMessage(${JSON.stringify(message)}, window.location.origin); window.close();</script><p>Authentication complete. You may close this window.</p></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = request.headers.get('Cookie') || '';
  const expected = cookies.match(/(?:^|;\s*)decap_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || !expected || state !== expected) return html({ error: 'Invalid OAuth state' });
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return html({ error: 'OAuth environment variables are not configured' });
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/api/callback` })
  });
  const token = await tokenResponse.json();
  if (!token.access_token) return html({ error: 'GitHub did not return an access token' });
  return html({ token: { access_token: token.access_token, token_type: token.token_type || 'bearer' } });
}
