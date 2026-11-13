import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "../types";
import { api, setUnauthorizedHandler, tokenStore } from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { companyName: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [hasToken, setHasToken] = useState(() => !!tokenStore.get());

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.me()).user,
    enabled: hasToken,
    retry: false,
    staleTime: Infinity,
  });

  const logout = useCallback(() => {
    tokenStore.clear();
    setHasToken(false);
    qc.clear();
  }, [qc]);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const value = useMemo<AuthState>(() => {
    const start = async (p: Promise<{ token: string; user: AuthUser }>) => {
      const { token, user } = await p;
      tokenStore.set(token);
      qc.clear(); // nunca reaproveita cache de outra sessão/empresa
      qc.setQueryData(["me"], user);
      setHasToken(true);
    };
    return {
      user: hasToken ? (me.data ?? null) : null,
      loading: hasToken && me.isPending,
      login: (email, password) => start(api.login({ email, password })),
      register: (input) => start(api.register(input)),
      logout,
    };
  }, [hasToken, me.data, me.isPending, qc, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
