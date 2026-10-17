import { describe, expect, it } from "vitest";

import {
  HttpError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnprocessableEntityError,
  ValidationError,
} from "#/lib/http-errors";

describe("http-errors", () => {
  it("maps each refusal to the status a direct HTTP caller sees", () => {
    const cases = [
      { error: new ValidationError("bad payload"), status: 400, name: "ValidationError" },
      { error: new UnauthorizedError(), status: 401, name: "UnauthorizedError" },
      { error: new NotFoundError("no row"), status: 404, name: "NotFoundError" },
      {
        error: new UnprocessableEntityError("refused"),
        status: 422,
        name: "UnprocessableEntityError",
      },
      {
        error: new ServiceUnavailableError("unconfigured"),
        status: 503,
        name: "ServiceUnavailableError",
      },
    ] as const;

    for (const { error, status, name } of cases) {
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(status);
      expect(error.name).toBe(name);
    }
  });

  it("keeps the default unauthorized message and honours overrides", () => {
    expect(new UnauthorizedError().message).toBe("Unauthorized");
    expect(new UnauthorizedError("Sign in to continue").message).toBe("Sign in to continue");
    expect(new ValidationError("title is required").message).toBe("title is required");
    expect(new NotFoundError("Note not found").status).toBe(404);
  });
});
