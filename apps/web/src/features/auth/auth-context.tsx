import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState
} from "react";
import type { AuthSession } from "./auth-types";
import { API_BASE_URL } from "../../lib/env";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  session: AuthSession;
  signInWithGoogle: (credential: string) => Promise<void>;
};

const anonymousSession: AuthSession = {
  authenticated: false,
  user: null
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch auth session.");
  }

  return (await response.json()) as AuthSession;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>(anonymousSession);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSession() {
    setIsLoading(true);

    try {
      setSession(await fetchSession());
    } catch {
      setSession(anonymousSession);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle(credential: string) {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
        body: JSON.stringify({ credential }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Google login failed.");
      }

      setSession((await response.json()) as AuthSession);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: session.authenticated,
        isLoading,
        refreshSession,
        session,
        signInWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
