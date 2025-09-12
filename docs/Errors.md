# Error Handling

This project distinguishes between three primary error types:

| Type | Description | Handling |
| ---- | ----------- | -------- |
| **User Error** | Validation or input issues caused by the user. | Report via toast, allow correction. |
| **Network Error** | Connectivity problems or timeouts. | `apiService` retries with exponential backoff and surfaces a toast. |
| **System Error** | Unexpected server or code failures. | Logged via `handleError` and caught by React `ErrorBoundary`. |

## Layer Responsibilities

- **API Layer** (`src/services/apiService.js`): wraps all network and Supabase calls with timeouts, retries and cancellation via `AbortController`.
- **Components & Pages**: catch service errors, call `handleError` for structured logging and user toasts.
- **React Error Boundaries**: `ErrorBoundary` at the app root and route level prevents UI crashes and shows fallback UI.

For new code, always route data calls through `apiService`, surface a toast on failure, and let errors bubble to Error Boundaries.
