import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { AuthSession, AuthUser, AuthWallet } from "@/contracts/auth";

interface LoginPromptState {
  isOpen: boolean;
  message: string;
  requiresWallet: boolean;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  wallet: AuthWallet | null;
  loginPrompt: LoginPromptState;
}

type AuthAction =
  | {
      type: "SET_AUTH";
      payload: {
        user: AuthUser;
        session: AuthSession;
        wallet?: AuthWallet | null;
      };
    }
  | { type: "CLEAR_AUTH" }
  | {
      type: "OPEN_LOGIN_PROMPT";
      payload: { message: string; requiresWallet: boolean };
    }
  | { type: "SET_WALLET"; payload: { wallet: AuthWallet | null } }
  | { type: "DISMISS_LOGIN_PROMPT" };

interface AuthContextValue extends AuthState {
  setAuth: (payload: { user: AuthUser; session: AuthSession; wallet?: AuthWallet | null }) => void;
  setWallet: (wallet: AuthWallet | null) => void;
  clearAuth: () => void;
  openLoginPrompt: (message?: string, options?: { requiresWallet?: boolean }) => void;
  dismissLoginPrompt: () => void;
}

const DEFAULT_LOGIN_MESSAGE = "Please log in to continue.";

const initialState: AuthState = {
  user: null,
  session: null,
  wallet: null,
  loginPrompt: {
    isOpen: false,
    message: DEFAULT_LOGIN_MESSAGE,
    requiresWallet: false,
  },
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_AUTH":
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        wallet: action.payload.wallet ?? null,
      };
    case "CLEAR_AUTH":
      return {
        ...state,
        user: null,
        session: null,
        wallet: null,
      };
    case "OPEN_LOGIN_PROMPT":
      return {
        ...state,
        loginPrompt: {
          isOpen: true,
          message: action.payload.message,
          requiresWallet: action.payload.requiresWallet,
        },
      };
    case "SET_WALLET":
      return {
        ...state,
        wallet: action.payload.wallet,
      };
    case "DISMISS_LOGIN_PROMPT":
      return {
        ...state,
        loginPrompt: {
          ...state.loginPrompt,
          isOpen: false,
        },
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setAuth = useCallback((payload: { user: AuthUser; session: AuthSession; wallet?: AuthWallet | null }) => {
    dispatch({ type: "SET_AUTH", payload });
  }, []);

  const clearAuth = useCallback(() => {
    dispatch({ type: "CLEAR_AUTH" });
  }, []);

  const setWallet = useCallback((wallet: AuthWallet | null) => {
    dispatch({ type: "SET_WALLET", payload: { wallet } });
  }, []);

  const openLoginPrompt = useCallback((message?: string, options?: { requiresWallet?: boolean }) => {
    dispatch({
      type: "OPEN_LOGIN_PROMPT",
      payload: {
        message: message ?? DEFAULT_LOGIN_MESSAGE,
        requiresWallet: options?.requiresWallet ?? false,
      },
    });
  }, []);

  const dismissLoginPrompt = useCallback(() => {
    dispatch({ type: "DISMISS_LOGIN_PROMPT" });

    const params = new URLSearchParams(window.location.search);
    if (!params.has("login")) {
      return;
    }

    params.delete("login");
    params.delete("next");
    const query = params.toString();
    const target = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", target);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setAuth,
      setWallet,
      clearAuth,
      openLoginPrompt,
      dismissLoginPrompt,
    }),
    [state, setAuth, setWallet, clearAuth, openLoginPrompt, dismissLoginPrompt],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthState() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthState must be used within AuthProvider");
  }

  return context;
}
