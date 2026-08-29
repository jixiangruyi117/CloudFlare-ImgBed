# SRL-compatible Cloudflare Pages deployment

When this repository is deployed to Cloudflare Pages, the `/functions` directory must be deployed together with `frontend-dist`.

A Dashboard drag-and-drop / static-only deployment can serve the UI but does **not** compile the Pages Functions directory. In that state the site may open normally while `POST /upload` returns HTTP 405.

## Existing Direct Upload Pages project

Run Wrangler from the **repository root** so it can discover both `frontend-dist` and the root-level `functions` directory:

```bash
npm install
npx wrangler login
npx wrangler pages deploy frontend-dist --project-name=<your-pages-project-name>
```

For example, a project served at `https://cloudflare-imgbed-3wx.pages.dev` normally uses:

```bash
npx wrangler pages deploy frontend-dist --project-name=cloudflare-imgbed-3wx
```

Keep the existing KV / D1 / R2 bindings and environment variables configured on the Pages project in the Cloudflare dashboard.

## Verify the dynamic backend

After deployment, this URL must return JSON instead of the SPA HTML shell:

```text
https://<your-project>.pages.dev/api/srl/capabilities
```

Expected fields include:

```json
{
  "srlCompatible": true,
  "protocolVersion": 1,
  "service": "cloudflare-imgbed"
}
```

If the capability URL returns HTML, 404, or another static-site response, the dynamic Pages Functions backend was not deployed and SRL should not attempt `/upload` yet.
