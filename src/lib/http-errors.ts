/**
 * The base for a refusal that carries the HTTP status a direct caller should receive. Handlers
 * throw these from pure functions integration tests call directly; `withSession` reads the
 * status at the pipeline boundary. Client-reachable on purpose (the features' schemas import
 * `ValidationError` for browser-side validation), so this module must stay import-free.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The payload did not match the schema. */
export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

/** Nobody is signed in. */
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

/** The row does not exist — 404, distinct from "this role may not touch it". */
export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

/** The payload parsed, but the server refuses to act on what it contains. */
export class UnprocessableEntityError extends HttpError {
  constructor(message: string) {
    super(422, message);
  }
}

/** A dependency the operation needs is not configured, so nothing can be attempted. */
export class ServiceUnavailableError extends HttpError {
  constructor(message: string) {
    super(503, message);
  }
}
