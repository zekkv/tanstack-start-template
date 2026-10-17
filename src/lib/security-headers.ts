/**
 * Security headers applied to every response by the request middleware in src/start.ts.
 * `frame-ancestors 'none'` blocks clickjacking, `object-src 'none'` kills plugin content,
 * `base-uri 'self'` stops injected <base> tags from hijacking relative URLs, `nosniff`
 * prevents content-type confusion, and `referrer-policy` keeps full URLs out of other
 * origins' logs.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

/** A copy of `response` with the security headers set; all other headers survive. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
