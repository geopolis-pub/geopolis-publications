# GEOPOLIS CMS

The CMS is Decap CMS backed by the GitHub repository `geopolis-pub/geopolis-publications`.

Open `/admin/` on the deployed site. The GitHub backend requires an OAuth/authentication endpoint configured for the Cloudflare Pages project; do not put a GitHub client secret or personal access token in this repository.

Articles are stored in `content/articles/`, research in `content/dissertations/`, events in `content/events/`, authors in `content/team/`, and uploads in `public/images/uploads/`.

The editorial workflow creates drafts and publishes through GitHub pull requests. Review every migration and publication change before merging.
