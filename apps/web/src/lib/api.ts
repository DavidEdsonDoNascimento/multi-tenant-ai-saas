import type { AuthUser, Product, ProductFilters, ProductInput, ToolCallSummary } from "../types";

const TOKEN_KEY = "token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(init.body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor. Verifique se a API está em execução.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    // 401 em rotas autenticadas = sessão expirada; no login significa credenciais inválidas.
    if (res.status === 401 && token) onUnauthorized();
    const fields: Record<string, string> = {};
    for (const d of err?.details ?? []) if (d.path && !fields[d.path]) fields[d.path] = d.message;
    throw new ApiError(res.status, err?.code ?? "ERROR", err?.message ?? "Erro inesperado", fields);
  }
  return data as T;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const api = {
  login: (body: { email: string; password: string }) => request<AuthResponse>("/auth/login", { method: "POST", body }),
  register: (body: { companyName: string; name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body }),
  me: () => request<{ user: AuthUser }>("/auth/me"),

  listProducts: (f: ProductFilters) => {
    const q = new URLSearchParams({ sort: f.sort, limit: "100" });
    if (f.search.trim()) q.set("search", f.search.trim());
    if (f.category) q.set("category", f.category);
    return request<{ items: Product[] }>(`/products?${q}`);
  },
  categories: () => request<{ items: string[] }>("/products/categories"),
  createProduct: (body: ProductInput) => request<Product>("/products", { method: "POST", body }),
  updateProduct: (id: string, body: ProductInput) => request<Product>(`/products/${id}`, { method: "PATCH", body }),
  deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),

  chat: (message: string, history: { role: "user" | "assistant"; content: string }[]) =>
    request<{ reply: string; toolCalls: ToolCallSummary[] }>("/chat", { method: "POST", body: { message, history } }),
};
