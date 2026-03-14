import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-xs">AB</span>
          </div>
          <span className="font-display font-semibold text-foreground text-sm">
            AutoBidX <span className="text-primary">AI</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Designed by <span className="text-foreground font-medium">Frank Bazuaye</span> · Powered By{" "}
          <span className="text-primary font-medium">LiveGig Ltd</span>
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/list-vehicle" className="hover:text-foreground transition-colors">List Vehicle</Link>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
