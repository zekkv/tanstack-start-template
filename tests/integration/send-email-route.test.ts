import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "#/routes/api/send-email";
import { sendEmail } from "#/lib/mailer";

let currentRequest: Request;

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => currentRequest,
}));

vi.mock("#/lib/mailer", () => ({
  sendEmail: vi.fn<() => Promise<{ id: string }>>().mockResolvedValue({ id: "msg_12345" }),
}));

vi.mock("#/env", () => ({
  env: {
    EMAIL_API_SECRET: "correct-secret-token-123",
  },
}));

function getPostHandler() {
  const handlers = Route.options.server?.handlers as { POST?: () => Promise<Response> } | undefined;
  const handler = handlers?.POST;
  if (!handler) {
    throw new Error("POST handler is not defined on /api/send-email");
  }
  return handler;
}

describe("POST /api/send-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized if secret header is missing or wrong", async () => {
    currentRequest = new Request("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: { "x-email-secret": "wrong-secret" },
      body: JSON.stringify({
        type: "verification",
        to: "user@example.com",
        subject: "Verify",
        data: { url: "https://example.com/verify" },
      }),
    });

    const handler = getPostHandler();
    const response = await handler();
    expect(response.status).toBe(401);

    const json = (await response.json()) as { error: string };
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 Bad Request if payload does not match schema", async () => {
    currentRequest = new Request("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: {
        "x-email-secret": "correct-secret-token-123",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "verification",
        to: "not-an-email",
        subject: "Verify",
        data: {},
      }),
    });

    const handler = getPostHandler();
    const response = await handler();
    expect(response.status).toBe(400);

    const json = (await response.json()) as { error: string };
    expect(json.error).toBe("Invalid request data");
  });

  it("dispatches verification email and returns 200 on success", async () => {
    currentRequest = new Request("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: {
        "x-email-secret": "correct-secret-token-123",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "verification",
        to: "user@example.com",
        subject: "Verify Email",
        data: { url: "https://example.com/verify?token=123" },
      }),
    });

    const handler = getPostHandler();
    const response = await handler();
    expect(response.status).toBe(200);

    const json = (await response.json()) as { success: boolean; data: { id: string } };
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("msg_12345");
    expect(sendEmail).toHaveBeenCalledWith("user@example.com", "Verify Email", expect.anything());
  });

  it("dispatches reset-password email and returns 200 on success", async () => {
    currentRequest = new Request("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: {
        "x-email-secret": "correct-secret-token-123",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "reset-password",
        to: "user@example.com",
        subject: "Reset Password",
        data: { url: "https://example.com/reset?token=abc" },
      }),
    });

    const handler = getPostHandler();
    const response = await handler();
    expect(response.status).toBe(200);

    const json = (await response.json()) as { success: boolean };
    expect(json.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith("user@example.com", "Reset Password", expect.anything());
  });

  it("returns 500 Internal Server Error if mailer throws", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP server connection failed"));

    currentRequest = new Request("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: {
        "x-email-secret": "correct-secret-token-123",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "verification",
        to: "user@example.com",
        subject: "Verify",
        data: { url: "https://example.com/verify" },
      }),
    });

    const handler = getPostHandler();
    const response = await handler();
    expect(response.status).toBe(500);

    const json = (await response.json()) as { error: string };
    expect(json.error).toBe("Internal server error");
  });
});
