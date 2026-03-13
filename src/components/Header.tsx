import { Link } from "react-router-dom";
import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-sm">AB</span>
          </div>
          <span className="font-display font-bold text-foreground text-lg hidden sm:block">
            AutoBidX <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles... try 'Toyota under $10k' or 'SUV low mileage'"
              className="pl-9 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
          <Button variant="hero" size="sm" className="hidden sm:inline-flex">
            List Vehicle
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search... 'cheap Toyota under $7k'"
              className="pl-9 bg-secondary border-border"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
