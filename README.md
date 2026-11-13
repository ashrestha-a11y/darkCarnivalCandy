# Dark Carnival Trade Planner — React + Vercel + Upstash Redis

A deployable React/Vite application based on the existing Dark Carnival candy trader. Includes candy artwork extracted from the supplied game screenshots, editable inventory and coin requirements, any number of saved fixed recipes, Admin management, 3-for-1 custom exchanges, BFS trade finder, trade history and persistence.

## Deploy to Vercel

1. Unzip the project and push the folder contents to a GitHub repository.
2. In [Vercel](https://vercel.com/new), import that repository. Vercel should detect **Vite** automatically; Build Command: `npm run build`, Output Directory: `dist`.
3. Open your Vercel project's **Storage** tab (or Marketplace). Add **Upstash Redis** and connect it to this project. [Upstash setup instructions](https://upstash.com/docs/redis/howto/vercelintegration).
4. Verify that Vercel project Environment Variables include `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (server only), then **redeploy** the app.
5. Visit the Vercel URL. The footer should show **Cloud Synced**. Open `/admin` to manage recipes.

**Important:** A Vercel deployment alone does not create a database. Until the Redis connection is configured, the app transparently operates in **Local Mode**, saving changes only in that browser. Database access happens in `/api/state`, not in React.

## Develop locally

```bash
npm install
npm run dev
```

Vite opens the frontend, normally at `http://localhost:5173`. Without a local Vercel server and Redis environment variables, local development uses browser storage. To test the API locally, install Vercel CLI (`npm i -g vercel`), run `vercel link`, `vercel env pull .env.local`, and `vercel dev` (normally port 3000).

For direct manual setup, copy `.env.example` to `.env.local` and supply your Upstash Redis credentials. Never prefix database tokens with `VITE_`; that would expose them in the client bundle.

## Persistence and future extensibility

- **React UI** lives in `src/App.jsx`, with UI-free recipes and validation in `src/lib/model.js`.
- **Trade search** lives in `src/lib/solver.js` (nonblocking breadth-first search).
- **Persistence client** lives in `src/lib/storage.js`, which calls `/api/state`.
- **Database API** lives in `api/state.js`; only this Vercel function accesses Upstash Redis.
- The server stores one JSON document per workspace, using the key `dark-carnival:v1:<workspace-id>`. No migrations or tables are needed.
- A random workspace ID is generated in the user's browser, so separate browsers have separate workspaces. Exports/imports allow manual backups; browser storage is NOT a security boundary.
- **Authentication has not been implemented.** The workspace ID is a convenience identifier, not real access control. Before allowing public accounts, sharing or sensitive data, add a real auth provider, validate sessions server-side and derive workspace/user IDs exclusively from the authenticated session. Add rate limits and ownership rules at the API layer. The existing `/api/state` endpoint is not intended for multiuser production use without those protections.
- The API currently uses whole-document last-write-wins saves. If you later expect multiple simultaneous devices editing one workspace, add versioning/optimistic concurrency or per-entity records.
- The solver caps exploration at 170,000 states and 13 trades. It finds a shortest sequence **within these limits**, not necessarily a globally optimal plan for unbounded recipes.

## Migrating recipes from the old standalone HTML

The old standalone HTML stored its saved recipes in browser `localStorage` under `darkCarnivalExchangeAdminV1`. Data from a `file://` page cannot automatically be read by a new Vercel website.

1. Open your **old HTML planner** in the browser/location where the recipes appear.
2. Open its browser developer console and execute:

   ```js
   const blob = new Blob([localStorage.getItem('darkCarnivalExchangeAdminV1')], {type:'application/json'});
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = 'my-old-candy-recipes.json';
   link.click();
   setTimeout(() => URL.revokeObjectURL(link.href), 1000);
   ```
3. On the new React app, click **Import Backup** and select that file. It understands the old `{library,activeIds}` format and restores original default counts/requirements. Set your actual counts if they differ.
4. Use **Export Backup** in the React app periodically, especially before changing browsers or hosting configuration.

A complete backup created by the React app includes recipes, inventory, coin requirements and history.

## Deployment testing checklist

- Navigate to `/` and `/admin` directly.
- Create recipe with Save (library only); Save & Add (library and active), then edit/deactivate/delete it.
- Try duplicate ingredient pairs and duplicate names; they are blocked.
- Update candy quantities/requirements and refresh the browser; verify persistence.
- Check the footer for **Cloud Synced** after Redis setup.
- Try 5+ active fixed exchanges; main page should scroll within Fixed Exchanges while Admin list remains expanded.
