import { Zap, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroCar from "@/assets/hero-car.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroCar} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>

      {/* Content */}
      <div className="relative container py-16 md:py-24 space-y-6">
        <div className="max-w-2xl space-y-4">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            AI-Powered <br />
            <span className="text-primary">Car Auctions</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg">
            Search, analyze, and bid on vehicles globally. Let AI find the best deals and bid for you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="xl">
              Start Bidding
            </Button>
            <Button variant="outline" size="xl">
              List Your Vehicle
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 pt-6 border-t border-border/50">
          {[
            { icon: Zap, label: "AI Insights", value: "Real-time" },
            { icon: TrendingUp, label: "Vehicles Listed", value: "12,400+" },
            { icon: Shield, label: "Verified Sellers", value: "2,100+" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
