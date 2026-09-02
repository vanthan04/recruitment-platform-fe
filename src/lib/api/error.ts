// Split out of lib/api/index.ts (which starts with `import "server-only"`)
// so this plain, side-effect-free class can be imported from client
// components too — e.g. useApiToast's `error instanceof ApiError` check.
// Next's bundler blocks a client bundle from including *any* export of a
// module that pulls in "server-only", regardless of which export is used,
// so ApiError needs to live somewhere that import chain doesn't reach.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
