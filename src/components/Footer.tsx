import { Button } from "@/components/ui/button";
import { 
  Twitter, 
  Github, 
  MessageCircle, 
  Mail, 
  ExternalLink 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";



const Footer = () => {
  return (
    <footer className="bg-secondary/20 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <img src={logo} alt="Logo" />
                {/* <span className="text-lg font-bold text-primary-foreground">A</span> */}
              </div>
              <span className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                APOM DApp
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The ultimate decentralized platform for gaming, DeFi, and NFTs. 
              Built for the future of Web3.
            </p>
            {/* <div className="flex space-x-2">
              <Button variant="ghost" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div> */}
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link  to="/gaming" className="hover:text-gaming transition-smooth">Gaming Hub</Link></li>
              <li><Link  to="/defi" className="hover:text-gaming transition-smooth">DeFi Exchange</Link></li>
              <li><Link  to="/nft-marketplace" className="hover:text-gaming transition-smooth">NFT Marketplace</Link></li>
              <li><Link  to="/launchpad" className="hover:text-gaming transition-smooth">Launchpad</Link></li>
              <li><Link  to="/governance" className="hover:text-gaming transition-smooth">Governance</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-semibold mb-4">Developers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-smooth flex items-center">
                API Documentation <ExternalLink className="w-3 h-3 ml-1" />
              </a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth flex items-center">
                SDK & Tools <ExternalLink className="w-3 h-3 ml-1" />
              </a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth flex items-center">
                Smart Contracts <ExternalLink className="w-3 h-3 ml-1" />
              </a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">Bug Bounty</a></li>
              <li><a href="#" className="hover:text-foreground transition-smooth">GitHub</a></li>
            </ul>
          </div>

          {/* Supported Networks */}
          <div>
            <h3 className="font-semibold mb-4">Networks</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Ethereum</li>
              <li>Polygon</li>
              <li>Binance Smart Chain</li>
              <li>Polkadot</li>
              <li>Arbitrum</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 APOM Solutions. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;