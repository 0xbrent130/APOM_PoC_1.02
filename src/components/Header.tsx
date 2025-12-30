import { Button } from "@/components/ui/button";
import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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

        {/* Connect Wallet Button */}
        <div className="flex items-center space-x-4">
          <Button variant="wallet" size="lg" className="hidden md:flex">
            <Wallet className="w-4 h-4" />
            Connect Wallet
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
            <Button variant="wallet" size="lg" className="w-full mt-4">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
