export async function onRequest(context) {
  const configured = {
    githubClientId: Boolean(context.env.GITHUB_CLIENT_ID),
    githubClientSecret: Boolean(context.env.GITHUB_CLIENT_SECRET)
  };

  const ready = configured.githubClientId && configured.githubClientSecret;
  return Response.json(
    {
      service: 'GEOPOLIS Decap CMS OAuth',
      ready,
      configured
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );
}
