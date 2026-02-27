import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, Wallet, X } from "lucide-react";
import { SiweMessage } from "siwe";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import logo from "@/assets/logo.png";
import { parseApiError } from "@/lib/api-client";
import {
  linkWalletToSession,
  loginWithEmail,
  logoutAuthSession,
  registerWithEmail,
  requestWalletNonce,
  verifyWalletSession,
} from "@/lib/auth-api";
import { useAuthState } from "@/state/auth-state";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [walletPending, setWalletPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const location = useLocation();
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: signMessagePending } = useSignMessage();
  const {
    user,
    session,
    wallet,
    loginPrompt,
    dismissLoginPrompt,
    clearAuth,
    setAuth,
    setWallet,
    openLoginPrompt,
  } = useAuthState();

  const primaryConnector = useMemo(() => connectors[0], [connectors]);
  const linkedWalletConnected = Boolean(
    wallet && isConnected && address && wallet.address.toLowerCase() === address.toLowerCase(),
  );

  const resetFormError = () => {
    setFormError(null);
  };

  const handleConnectWallet = async () => {
    resetFormError();

    if (!primaryConnector) {
      setFormError("No injected wallet provider was found in this browser.");
      return;
    }

    try {
      await connectAsync({ connector: primaryConnector });
    } catch (error) {
      setFormError(parseApiError(error).safeMessage);
    }
  };

  const buildSiweMessage = (nonce: string, activeAddress: string, activeChainId: number) => {
    return new SiweMessage({
      domain: window.location.host,
      address: activeAddress,
      statement: "Sign in to APOM DApp.",
      uri: window.location.origin,
      version: "1",
      chainId: activeChainId,
      nonce,
    }).prepareMessage();
  };

  const handleWalletProof = async (mode: "signin" | "link") => {
    resetFormError();

    if (!address || !chainId) {
      setFormError("Connect your wallet before signing this action.");
      return;
    }

    if (mode === "link" && !session) {
      setFormError("Sign in with email before linking a wallet.");
      return;
    }

    setWalletPending(true);
    try {
      const noncePayload = await requestWalletNonce({
        address,
        chainId,
      });

      const message = buildSiweMessage(noncePayload.nonce, noncePayload.address, noncePayload.chainId);
      const signature = await signMessageAsync({ account: address, message });

      if (mode === "signin") {
        const authPayload = await verifyWalletSession({
          message,
          signature,
          nonceToken: noncePayload.nonceToken,
        });

        setAuth({
          user: authPayload.user,
          session: authPayload.session,
          wallet: authPayload.wallet,
        });
      } else {
        const linkPayload = await linkWalletToSession({
          message,
          signature,
          nonceToken: noncePayload.nonceToken,
        });

        setWallet(linkPayload.wallet);
      }

      dismissLoginPrompt();
    } catch (error) {
      setFormError(parseApiError(error).safeMessage);
    } finally {
      setWalletPending(false);
    }
  };

  const handleEmailAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFormError();
    setAuthPending(true);

    try {
      const authPayload =
        authMode === "signin"
          ? await loginWithEmail({
              email,
              password,
            })
          : await registerWithEmail({
              email,
              password,
              displayName,
            });

      setAuth({
        user: authPayload.user,
        session: authPayload.session,
      });

      if (!loginPrompt.requiresWallet) {
        dismissLoginPrompt();
      }
    } catch (error) {
      setFormError(parseApiError(error).safeMessage);
    } finally {
      setAuthPending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (session) {
        await logoutAuthSession();
      }
    } catch (_error) {
      // Ignore logout API failures and still clear client state.
    } finally {
      clearAuth();
      disconnect();
      setIsMenuOpen(false);
    }
  };

  const walletActionLabel = linkedWalletConnected
    ? "Disconnect Wallet"
    : wallet
      ? "Reconnect Wallet"
      : "Connect Wallet";

  const openWalletPrompt = () => {
    openLoginPrompt(
      session
        ? "Connect and link your wallet for protected actions."
        : "Sign in and connect your wallet to unlock protected actions.",
      { requiresWallet: true },
    );
  };

  const renderSessionButtons = (mobile = false) => (
    <>
      {session ? (
        <Button
          variant="outline"
          size="lg"
          className={mobile ? "w-full mt-4" : "hidden md:flex"}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Button
          variant="outline"
          size="lg"
          className={mobile ? "w-full mt-4" : "hidden md:flex"}
          onClick={() => {
            openLoginPrompt("Sign in to unlock protected actions.");
            if (mobile) {
              setIsMenuOpen(false);
            }
          }}
        >
          Sign In
        </Button>
      )}

      <Button
        variant="wallet"
        size="lg"
        className={mobile ? "w-full" : "hidden md:flex"}
        onClick={() => {
          openWalletPrompt();
          if (mobile) {
            setIsMenuOpen(false);
          }
        }}
      >
        <Wallet className="w-4 h-4" />
        {walletActionLabel}
      </Button>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <img src={logo} alt="Logo" />
          </div>
          <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">APOM DApp</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/gaming"
            className={`transition-smooth ${location.pathname === "/gaming" ? "text-gaming" : "text-foreground hover:text-gaming"}`}
          >
            Gaming
          </Link>
          <Link
            to="/defi"
            className={`transition-smooth ${location.pathname === "/defi" ? "text-defi" : "text-foreground hover:text-defi"}`}
          >
            DeFi
          </Link>
          <Link
            to="/nft-marketplace"
            className={`transition-smooth ${location.pathname === "/nft-marketplace" ? "text-nft" : "text-foreground hover:text-nft"}`}
          >
            NFT Marketplace
          </Link>
          <Link
            to="/launchpad"
            className={`transition-smooth ${location.pathname === "/launchpad" ? "text-primary" : "text-foreground hover:text-primary"}`}
          >
            Launchpad
          </Link>
          <Link
            to="/governance"
            className={`transition-smooth ${location.pathname === "/governance" ? "text-accent" : "text-foreground hover:text-accent"}`}
          >
            Governance
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {renderSessionButtons()}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/gaming"
              className={`block transition-smooth ${location.pathname === "/gaming" ? "text-gaming" : "text-foreground hover:text-gaming"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Gaming
            </Link>
            <Link
              to="/defi"
              className={`block transition-smooth ${location.pathname === "/defi" ? "text-defi" : "text-foreground hover:text-defi"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              DeFi
            </Link>
            <Link
              to="/nft-marketplace"
              className={`block transition-smooth ${location.pathname === "/nft-marketplace" ? "text-nft" : "text-foreground hover:text-nft"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              NFT Marketplace
            </Link>
            <Link
              to="/launchpad"
              className={`block transition-smooth ${location.pathname === "/launchpad" ? "text-primary" : "text-foreground hover:text-primary"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Launchpad
            </Link>
            <Link
              to="/governance"
              className={`block transition-smooth ${location.pathname === "/governance" ? "text-accent" : "text-foreground hover:text-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Governance
            </Link>
            {renderSessionButtons(true)}
          </nav>
        </div>
      )}

      <Dialog open={loginPrompt.isOpen} onOpenChange={(open) => !open && dismissLoginPrompt()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authenticate to continue</DialogTitle>
            <DialogDescription>{loginPrompt.message}</DialogDescription>
          </DialogHeader>

          {session && user ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
                <p>Signed in as {user.displayName}</p>
                <p>Email: {user.email}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {!isConnected ? (
                  <Button variant="wallet" onClick={() => void handleConnectWallet()} disabled={connectPending || walletPending}>
                    {connectPending ? "Connecting..." : "Connect Wallet"}
                  </Button>
                ) : wallet && linkedWalletConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      disconnect();
                    }}
                  >
                    Disconnect Wallet
                  </Button>
                ) : (
                  <Button
                    variant="wallet"
                    onClick={() => void handleWalletProof("link")}
                    disabled={walletPending || signMessagePending}
                  >
                    {walletPending || signMessagePending ? "Signing..." : "Link Wallet"}
                  </Button>
                )}
                <Button variant="outline" onClick={dismissLoginPrompt}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleEmailAuthSubmit}>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMode === "signin" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMode("signin")}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={authMode === "register" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </Button>
              </div>

              {authMode === "register" ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Display name"
                  required
                  minLength={1}
                />
              ) : null}

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Password"
                required
                minLength={8}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={authPending || walletPending}>
                  {authPending ? "Submitting..." : authMode === "signin" ? "Sign In" : "Create Account"}
                </Button>
                {!isConnected ? (
                  <Button
                    type="button"
                    variant="wallet"
                    onClick={() => void handleConnectWallet()}
                    disabled={connectPending || walletPending}
                  >
                    {connectPending ? "Connecting..." : "Connect Wallet"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="wallet"
                    onClick={() => void handleWalletProof("signin")}
                    disabled={walletPending || signMessagePending}
                  >
                    {walletPending || signMessagePending ? "Signing..." : "Sign In With Wallet"}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={dismissLoginPrompt}>
                  Dismiss
                </Button>
              </div>
            </form>
          )}

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
