import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import Background from "./components/Background";
import Index from "./pages/Index";
import Gaming from "./pages/Gaming";
import DeFi from "./pages/DeFi";
import NFTMarketplace from "./pages/NFTMarketplace";
import Launchpad from "./pages/Launchpad";
import Governance from "./pages/Governance";
import NotFound from "./pages/NotFound";
import { apiClient, configureApiClient } from "@/lib/api-client";
import { wagmiConfig } from "@/lib/wallet-config";
import { AuthProvider, useAuthState } from "@/state/auth-state";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const LOGIN_REQUIRED_MESSAGE = "Your session expired. Please log in again.";

const ApiAuthEffects = () => {
  const { clearAuth, openLoginPrompt } = useAuthState();
  const { toast } = useToast();

  useEffect(() => {
    const maybePromptFromQueryParam = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "required") {
        openLoginPrompt(LOGIN_REQUIRED_MESSAGE);
      }
    };

    const redirectToLoginPrompt = () => {
      const params = new URLSearchParams(window.location.search);
      params.set("login", "required");

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (window.location.pathname !== "/") {
        params.set("next", currentPath);
        window.location.assign(`/?${params.toString()}`);
        return;
      }

      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}?${params.toString()}${window.location.hash}`,
      );
    };

    maybePromptFromQueryParam();

    if (import.meta.env.DEV) {
      (window as Window & { __apomApiClient?: typeof apiClient }).__apomApiClient = apiClient;
    }

    return configureApiClient({
      onUnauthorized: () => {
        clearAuth();
        openLoginPrompt(LOGIN_REQUIRED_MESSAGE);
        redirectToLoginPrompt();
      },
      onRequestError: (error) => {
        toast({
          variant: "destructive",
          title: "Request failed",
          description: error.safeMessage,
        });
      },
    });
  }, [clearAuth, openLoginPrompt, toast]);

  return null;
};

const ROUTE_AUTH_MESSAGES: Record<string, string> = {
  "/gaming": "Sign in and connect your wallet to unlock gaming actions.",
  "/defi": "Sign in and connect your wallet to unlock DeFi actions.",
  "/nft-marketplace": "Sign in and connect your wallet to unlock marketplace actions.",
  "/launchpad": "Sign in and connect your wallet to unlock launchpad actions.",
  "/governance": "Sign in and connect your wallet to unlock governance actions.",
};

const RouteAuthEffects = () => {
  const { pathname } = useLocation();
  const shownByPath = useRef<Set<string>>(new Set());
  const { session, openLoginPrompt } = useAuthState();

  useEffect(() => {
    if (session) {
      return;
    }

    const message = ROUTE_AUTH_MESSAGES[pathname];
    if (!message) {
      return;
    }

    if (shownByPath.current.has(pathname)) {
      return;
    }

    shownByPath.current.add(pathname);
    openLoginPrompt(message, { requiresWallet: true });
  }, [openLoginPrompt, pathname, session]);

  return null;
};

const App = () => (
  <AuthProvider>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ApiAuthEffects />
          <Background />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteAuthEffects />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gaming" element={<Gaming />} />
              <Route path="/defi" element={<DeFi />} />
              <Route path="/nft-marketplace" element={<NFTMarketplace />} />
              <Route path="/launchpad" element={<Launchpad />} />
              <Route path="/governance" element={<Governance />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </AuthProvider>
);

export default App;
