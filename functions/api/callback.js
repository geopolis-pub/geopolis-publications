function renderResponse(message, targetOrigin) {
  const script = `
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify(message)}',
          e.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  `;
  return new Response(
    `<!doctype html><html><body><script>${script}</script><p>Authenticating… you may close this window if it does not close automatically.</p></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

function errorResponse(errorMessage) {
  return new Response(
    `<!doctype html><html><body><p>Authentication failed: ${errorMessage}</p></body></html>`,
    { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = request.headers.get('Cookie') || '';
  const expected = cookies.match(/(?:^|;\s*)decap_oauth_state=([^;]+)/)?.[1];

  if (!code || !state || !expected || state !== expected) {
    return errorResponse('Invalid or missing OAuth state.');
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return errorResponse('OAuth environment variables are not configured.');
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`
    })
  });

  const token = await tokenResponse.json();
  if (!token.access_token) {
    return errorResponse(token.error_description || 'GitHub did not return an access token.');
  }

  return renderResponse({ token: token.access_token, provider: 'github' });
}
