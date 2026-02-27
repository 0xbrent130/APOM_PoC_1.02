import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Background from "./components/Background";
import Index from "./pages/Index";
import Gaming from "./pages/Gaming";
import DeFi from "./pages/DeFi";
import NFTMarketplace from "./pages/NFTMarketplace";
import Launchpad from "./pages/Launchpad";
import Governance from "./pages/Governance";
import NotFound from "./pages/NotFound";
import { apiClient, configureApiClient } from "@/lib/api-client";
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

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ApiAuthEffects />
        <Background />
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
  </AuthProvider>
);

export default App;
