# BH-Setlist-Manager

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.production` to `.env.local` (or create a new `.env`) and provide the required values:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Start the development server with `npm run dev`.

## Docker Deployment

This project includes Docker configuration for production deployment.

### Using Docker Compose

1. Copy `.env.example` to `.env` and provide the required values:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Build and start the application:
   ```bash
   docker-compose up -d
   ```

3. The application will be available at `http://localhost:3005`

4. To stop the application:
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. Build the image:
   ```bash
   docker build -t bh-setlist-manager .
   ```

2. Run the container with environment variables:
   ```bash
   docker run -d \
     -p 3005:3005 \
     -e VITE_SUPABASE_URL=your-supabase-project-url \
     -e VITE_SUPABASE_ANON_KEY=your-supabase-anon-key \
     bh-setlist-manager
   ```

3. The application will be available at `http://localhost:3005`

## Deploying on CapRover

This project ships with a production-ready Docker image that can be deployed directly on CapRover. The build outputs a static bundle that is served by Nginx. Runtime environment variables are injected on container start so the same image can be reused across environments.

1. Push the repository to CapRover (for example using `caprover deploy`).
2. In the CapRover dashboard (or via `caprover env set`), configure the two required environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy the app. The container entrypoint will render `/usr/share/nginx/html/runtime-env.js` using the provided environment variables and then start Nginx.

If either variable is missing the container will exit with an error, which helps catch misconfigurations early.
