# Baseline

- **Node version:** v20.19.4
- **Package manager:** npm 11.4.2 (detected via `package-lock.json`)
- **Install command:** `npm install`
- **Dev command:** `npm run dev -- --clearScreen=false`
- **Build command:** `npm run build`
- **Known warnings/errors:**
  - `npm warn Unknown env config "http-proxy"`
  - Peer dependency conflicts for React 18 vs 19 packages
  - `npm audit` reports 4 vulnerabilities (1 low, 2 moderate, 1 high)
  - `npm run lint` fails: ESLint configuration file missing
- **Next steps:**
  - Remove or configure the `http-proxy` npm env setting
  - Align React dependencies or update packages
  - Run `npm audit fix` (or `npm audit fix --force`) to address vulnerabilities
  - Add an `eslint.config.js` to enable linting
