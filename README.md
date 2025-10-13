# BH-Setlist-Manager

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.production` to `.env.local` (or create a new `.env`) and provide the required values:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Start the development server with `npm run dev`.

## Deploying on CapRover

This project ships with a production-ready Docker image that can be deployed directly on CapRover. The build outputs a static bundle that is served by Nginx. Runtime environment variables are injected on container start so the same image can be reused across environments.

1. Push the repository to CapRover (for example using `caprover deploy`).
2. In the CapRover dashboard (or via `caprover env set`), configure the two required environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy the app. The container entrypoint will render `/usr/share/nginx/html/runtime-env.js` using the provided environment variables and then start Nginx.

If either variable is missing the container will exit with an error, which helps catch misconfigurations early.
