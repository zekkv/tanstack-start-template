import { describe, expect, it } from "vitest";
import { withSecurityHeaders } from "#/lib/security-headers";

describe("withSecurityHeaders", () => {
  it("sets the security headers on a plain response", () => {
    const response = withSecurityHeaders(new Response("hello"));

    expect(response.headers.get("content-security-policy")).toBe(
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), microphone=(), geolocation=()"
    );
  });

  it("preserves existing headers, status, and body", async () => {
    const original = new Response("payload", {
      status: 201,
      headers: { "content-type": "text/plain" },
    });

    const response = withSecurityHeaders(original);

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(await response.text()).toBe("payload");
  });
});
