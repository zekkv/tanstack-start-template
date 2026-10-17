import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { withSecurityHeaders } from "#/lib/security-headers";

// Applies the security headers to every response flowing through the Start handler — SSR pages
// and server functions alike. `next()` resolves to the request context whose `response` is the
// final Response; returning it with the header-mounted copy makes Start use the new response.
const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
  const result = await next();
  return { ...result, response: withSecurityHeaders(result.response) };
});

/**
 * TanStack Start instance with Sentry global middlewares and security headers.
 *
 * - sentryGlobalRequestMiddleware: attaches request context to Sentry events.
 * - sentryGlobalFunctionMiddleware: captures errors in server functions.
 * - securityHeadersMiddleware: sets CSP/nosniff/referrer/permissions headers on every response.
 *
 * These must be first in the arrays to ensure all errors and requests are
 * captured before any other middleware has a chance to swallow them.
 */
export const startInstance = createStart(() => {
  return {
    requestMiddleware: [sentryGlobalRequestMiddleware, securityHeadersMiddleware],
    functionMiddleware: [sentryGlobalFunctionMiddleware],
  };
});
