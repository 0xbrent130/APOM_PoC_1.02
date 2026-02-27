import { Button } from "@/components/ui/button";
import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAuthState } from "@/state/auth-state";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, session, wallet, loginPrompt, dismissLoginPrompt, clearAuth, openLoginPrompt } = useAuthState();
  const authStatusLabel = session && user ? `Signed in as ${user.displayName}` : "Signed out";
  const walletStatusLabel = wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Disconnected";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <img src={logo} alt="Logo" />
            {/* <span className="text-xl font-bold text-primary-foreground">A</span> */}
          </div>
          <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
            APOM DApp
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/gaming"
            className={`transition-smooth ${
              location.pathname === "/gaming"
                ? "text-gaming"
                : "text-foreground hover:text-gaming"
            }`}
          >
            Gaming
          </Link>
          <Link
            to="/defi"
            className={`transition-smooth ${
              location.pathname === "/defi"
                ? "text-defi"
                : "text-foreground hover:text-defi"
            }`}
          >
            DeFi
          </Link>
          <Link
            to="/nft-marketplace"
            className={`transition-smooth ${
              location.pathname === "/nft-marketplace"
                ? "text-nft"
                : "text-foreground hover:text-nft"
            }`}
          >
            NFT Marketplace
          </Link>
          <Link
            to="/launchpad"
            className={`transition-smooth ${
              location.pathname === "/launchpad"
                ? "text-primary"
                : "text-foreground hover:text-primary"
            }`}
          >
            Launchpad
          </Link>
          <Link
            to="/governance"
            className={`transition-smooth ${
              location.pathname === "/governance"
                ? "text-accent"
                : "text-foreground hover:text-accent"
            }`}
          >
            Governance
          </Link>
        </nav>

        {/* Session Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
              Auth: {authStatusLabel}
            </span>
            <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
              Wallet: {walletStatusLabel}
            </span>
          </div>

          {session ? (
            <Button variant="outline" size="lg" className="hidden md:flex" onClick={clearAuth}>
              Sign Out
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="hidden md:flex"
              onClick={() => openLoginPrompt("Sign in to unlock protected actions.")}
            >
              Sign In
            </Button>
          )}

          <Button
            variant="wallet"
            size="lg"
            className="hidden md:flex"
            onClick={() =>
              openLoginPrompt(
                session
                  ? "Wallet connection will be enabled in the next delivery."
                  : "Sign in before connecting your wallet.",
              )
            }
          >
            <Wallet className="w-4 h-4" />
            {wallet ? "Wallet Connected" : "Connect Wallet"}
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/gaming"
              className={`block transition-smooth ${
                location.pathname === "/gaming"
                  ? "text-gaming"
                  : "text-foreground hover:text-gaming"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Gaming
            </Link>
            <Link
              to="/defi"
              className={`block transition-smooth ${
                location.pathname === "/defi"
                  ? "text-defi"
                  : "text-foreground hover:text-defi"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              DeFi
            </Link>
            <Link
              to="/nft-marketplace"
              className={`block transition-smooth ${
                location.pathname === "/nft-marketplace"
                  ? "text-nft"
                  : "text-foreground hover:text-nft"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              NFT Marketplace
            </Link>
            <Link
              to="/launchpad"
              className={`block transition-smooth ${
                location.pathname === "/launchpad"
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Launchpad
            </Link>
            <Link
              to="/governance"
              className={`block transition-smooth ${
                location.pathname === "/governance"
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Governance
            </Link>
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground space-y-1">
              <p>Auth: {authStatusLabel}</p>
              <p>Wallet: {walletStatusLabel}</p>
            </div>
            {session ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full mt-4"
                onClick={() => {
                  clearAuth();
                  setIsMenuOpen(false);
                }}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full mt-4"
                onClick={() => {
                  openLoginPrompt("Sign in to unlock protected actions.");
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </Button>
            )}
            <Button
              variant="wallet"
              size="lg"
              className="w-full"
              onClick={() => {
                openLoginPrompt(
                  session
                    ? "Wallet connection will be enabled in the next delivery."
                    : "Sign in before connecting your wallet.",
                );
                setIsMenuOpen(false);
              }}
            >
              <Wallet className="w-4 h-4" />
              {wallet ? "Wallet Connected" : "Connect Wallet"}
            </Button>
          </nav>
        </div>
      )}

      {loginPrompt.isOpen && (
        <div className="border-t border-border bg-background/90 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">{loginPrompt.message}</p>
            <Button variant="outline" size="sm" onClick={dismissLoginPrompt}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
