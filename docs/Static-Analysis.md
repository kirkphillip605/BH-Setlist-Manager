# Static Analysis

## ESLint Configuration

- Uses `@typescript-eslint/eslint-plugin` with recommended rules.
- React support via `eslint-plugin-react` and `eslint-plugin-react-hooks`.
- Accessibility checks through `eslint-plugin-jsx-a11y`.
- Module resolution enforced by `eslint-plugin-import`.
- `eslint-plugin-security` installed (rules currently disabled pending compatibility).
- `eslint-config-prettier` to avoid formatting conflicts.

## Prettier

- `printWidth`: 100
- `trailingComma`: `all`

## TypeScript

- `strict` mode and `incremental` compilation enabled.

## Current Issues

- `npm run lint` reported 626 problems including unresolved module paths and undefined globals such as `Response`, `Deno`, and `console`.
- `npm run typecheck` completed without type errors.
