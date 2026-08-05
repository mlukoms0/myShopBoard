/**
 * Base class for every API client in the app.
 *
 * Owns: base URL, query-string building, 204 handling, and turning an error response into a
 * readable message. Per-domain clients extend this - see assets.ts.
 *
 * The base URL is RELATIVE ("/api"). In dev, Vite's proxy forwards it to localhost:5280.
 * In production, nginx (or a load balancer) forwards it to the API service. Either way the
 * API address is never compiled into the bundle - see task #11 for why that matters.
 */

/** The API's error contract - GlobalExceptionHandler.cs always returns this shape. */
export interface ApiErrorBody {
  error?: string;
  field?: string;
  value?: string;
  traceId?: string;
}

/**
 * NOTE: written without constructor parameter properties on purpose.
 * tsconfig.app.json sets "erasableSyntaxOnly": true, which bans TypeScript-only runtime
 * syntax so the compiler only ever strips types rather than generating code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Standard paging envelope - matches PagedResult<T> on the server. */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
}

export abstract class ApiService {
  protected readonly baseUrl = "/api";

  /**
   * `params` is typed `object` rather than `Record<string, unknown>` on purpose: a plain
   * interface like AssetQuery has no index signature, so it is NOT assignable to a Record
   * even though it is obviously a bag of key/values. Typing the parameter loosely here beats
   * forcing an index signature onto every query interface.
   */
  protected async get<T>(path: string, params?: object): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // TODO(auth): attach the bearer token here once login exists. Doing it in this ONE
      // place is the point of the base class - no endpoint can forget it.
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // 204 No Content has no body - calling .json() on it throws.
    if (response.status === 204) return undefined as T;

    if (!response.ok) {
      let body: ApiErrorBody | undefined;
      try {
        body = (await response.json()) as ApiErrorBody;
      } catch {
        // Non-JSON error - typically a proxy or gateway failure rather than our API.
      }

      // Read body.error first: that is the server's human-readable message.
      // Falling back to "status 400" is what myStorage's client shows when the server
      // returns a bare string - useless to the user and to you.
      throw new ApiError(
        response.status,
        body?.error ?? `Request failed with status ${response.status}`,
        body,
      );
    }

    return (await response.json()) as T;
  }
}
