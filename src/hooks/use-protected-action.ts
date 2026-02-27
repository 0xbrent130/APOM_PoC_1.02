import { useCallback } from "react";
import { useAccount } from "wagmi";
import { useAuthState } from "@/state/auth-state";

interface AccessOptions {
  authMessage: string;
  walletMessage?: string;
  walletRequired?: boolean;
}

export function useProtectedAction() {
  const { session, wallet, openLoginPrompt } = useAuthState();
  const { address, isConnected } = useAccount();
  const skipWalletCheck = import.meta.env.VITE_E2E_SKIP_WALLET_CHECK === "1";

  const hasActiveLinkedWallet = Boolean(
    wallet &&
      isConnected &&
      address &&
      address.toLowerCase() === wallet.address.toLowerCase(),
  );

  const ensureAccess = useCallback(
    ({ authMessage, walletMessage, walletRequired = false }: AccessOptions) => {
      if (!session) {
        openLoginPrompt(authMessage, { requiresWallet: walletRequired });
        return false;
      }

      if (!walletRequired) {
        return true;
      }

      if (skipWalletCheck) {
        return true;
      }

      if (!wallet) {
        openLoginPrompt(walletMessage ?? "Connect and link your wallet to continue.", {
          requiresWallet: true,
        });
        return false;
      }

      if (!hasActiveLinkedWallet) {
        openLoginPrompt(
          walletMessage ?? "Reconnect your linked wallet to continue.",
          { requiresWallet: true },
        );
        return false;
      }

      return true;
    },
    [hasActiveLinkedWallet, openLoginPrompt, session, skipWalletCheck, wallet],
  );

  return {
    ensureAccess,
    hasActiveLinkedWallet,
  };
}
