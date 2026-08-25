# GEOPOLIS CMS Setup

## Current design

GEOPOLIS uses Decap CMS with GitHub as the content backend. This keeps the existing GitHub + Cloudflare Pages infrastructure and avoids exposing database credentials in browser code.

## Authentication requirement

The CMS configuration intentionally contains no secrets. Before `/admin/` can authenticate, configure a secure GitHub OAuth flow for the Cloudflare Pages project using environment variables in the Cloudflare dashboard. Never commit a GitHub client secret, access token, or Cloudflare API key.

## Publishing

1. Open `/admin/`.
2. Sign in through the configured GitHub OAuth flow.
3. Create or edit an article.
4. Add title, excerpt, author, category, tags, image, date and body.
5. Save a draft or publish through the editorial workflow.
6. Confirm the resulting GitHub change and Cloudflare Pages deployment.

## Preservation rule

Do not delete or rename existing files in `content/` without first exporting a backup and recording the old path, title, author, date, image and URL. Existing content must remain compatible with the frontend renderer.
