import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import apiClient from "@/lib/api";
import type { LoginRequest, LoginResponse, Rol, Usuario } from "@/types/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: Rol) => boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const raw = localStorage.getItem("user");

    if (token && raw) {
      try {
        const user = JSON.parse(raw) as Usuario;
        setState({ user, token, isLoading: false });
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const form = `username=${credentials.email}&password=${credentials.password}`;

    const { data } = await apiClient.post<LoginResponse>(
      "/api/v1/auth/login",
      form,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    localStorage.setItem("access_token", data.access_token);

    const rawPayload = data.access_token.split(".")[1];
    const padded = rawPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      rawPayload.length + ((4 - (rawPayload.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;

    console.debug("[Auth] JWT payload:", payload);

    const user: Usuario = {
      id: parseInt(payload["sub"] as string, 10),
      email: credentials.email,
      nombre: credentials.email,
      rol: payload["rol"] as Rol,
      estado: true,
    };

    localStorage.setItem("user", JSON.stringify(user));
    setState({ user, token: data.access_token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setState({ user: null, token: null, isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.user !== null && state.token !== null,
      login,
      logout,
      hasRole: (role: Rol) => state.user?.rol === role,
    }),
    [state, login, logout]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { AuthProvider, useAuth };