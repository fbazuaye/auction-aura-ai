import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/HeroSection";
import VehicleCard from "@/components/VehicleCard";
import SmartSearch from "@/components/SmartSearch";
import { mockVehicles } from "@/data/mockVehicles";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <HeroSection />

      <main className="container py-8 space-y-8">
        {/* Smart Search */}
        <section className="p-5 rounded-lg bg-card border border-border">
          <SmartSearch />
        </section>
        {/* Section: Live Auctions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="font-display font-bold text-xl text-foreground">Live Auctions</h2>
              <Badge variant="live">● LIVE</Badge>
            </div>
            <Link to="/dashboard" className="text-sm text-primary hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockVehicles
              .filter((v) => v.isLive)
              .slice(0, 3)
              .map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
          </div>
        </section>

        {/* Section: Ending Soon */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">Ending Soon</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...mockVehicles]
              .sort((a, b) => a.auctionEndsAt.getTime() - b.auctionEndsAt.getTime())
              .slice(0, 3)
              .map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
          </div>
        </section>

        {/* Section: Best AI Picks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-success" />
              <h2 className="font-display font-bold text-xl text-foreground">Best AI Picks</h2>
              <Badge variant="ai">AI Powered</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...mockVehicles]
              .sort((a, b) => b.aiScore - a.aiScore)
              .slice(0, 3)
              .map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
