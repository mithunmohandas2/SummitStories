export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database unavailable");
    this.name = "DatabaseUnavailableError";
  }
}

export function databaseUnavailableResponse() {
  return Response.json(
    { error: "Database unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
