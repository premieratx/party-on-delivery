export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpError extends Error {
  status?: number;
  info?: any;
  constructor(message: string, status?: number, info?: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

type Options = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT = 12000;

export async function request<T = unknown>(url: string, opts: Options = {}): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT, retries = 1 } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "content-type": body ? "application/json" : "text/plain",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include",
      keepalive: method !== "GET",
    });
    if (!res.ok) {
      const info = await safeJson(res);
      throw new HttpError(info?.message || res.statusText, res.status, info);
    }
    return (await safeJson(res)) as T;
  } catch (err: any) {
    if (retries > 0 && (err?.name === "AbortError" || !err?.status || err?.status >= 500)) {
      await new Promise((r) => setTimeout(r, backoffDelay(retries)));
      return request<T>(url, { ...opts, retries: retries - 1 });
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

function backoffDelay(remRetries: number) {
  const attempt = remRetries;
  return 250 * Math.pow(2, attempt);
}

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
