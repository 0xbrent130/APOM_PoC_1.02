import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthSession {
  id: string;
  role: string;
  expiresAt: string;
}

interface AuthWallet {
  id: string;
  userId: string;
  address: string;
  chainId: number;
  isPrimary: boolean;
  linkedAt: string;
}

interface LoginPromptState {
  isOpen: boolean;
  message: string;
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
      payload: { message: string };
    }
  | { type: "DISMISS_LOGIN_PROMPT" };

interface AuthContextValue extends AuthState {
  setAuth: (payload: { user: AuthUser; session: AuthSession; wallet?: AuthWallet | null }) => void;
  clearAuth: () => void;
  openLoginPrompt: (message?: string) => void;
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
        },
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

  const openLoginPrompt = useCallback((message?: string) => {
    dispatch({
      type: "OPEN_LOGIN_PROMPT",
      payload: { message: message ?? DEFAULT_LOGIN_MESSAGE },
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
      clearAuth,
      openLoginPrompt,
      dismissLoginPrompt,
    }),
    [state, setAuth, clearAuth, openLoginPrompt, dismissLoginPrompt],
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
