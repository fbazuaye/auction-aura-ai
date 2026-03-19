import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/VehicleCard";
import SmartSearch from "@/components/SmartSearch";
import { mockVehicles, type Vehicle } from "@/data/mockVehicles";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Clock, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function dbToVehicle(row: any): Vehicle {
  const auction = Array.isArray(row.auctions) ? row.auctions[0] : row.auctions;
  const bidCount = auction?.bids?.[0]?.count ?? 0;
  const isLive = auction?.status === "active" && new Date(auction.ends_at) > new Date();

  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    mileage: row.mileage,
    vin: row.vin ?? "",
    condition: (row.condition === "excellent" ? "Excellent" : row.condition === "good" ? "Good" : row.condition === "fair" ? "Fair" : "Salvage") as Vehicle["condition"],
    location: row.location ?? "Unknown",
    image: row.images?.[0] ?? "/placeholder.svg",
    currentBid: auction?.current_bid ?? auction?.start_price ?? 0,
    startPrice: auction?.start_price ?? 0,
    reservePrice: row.reserve_price ?? auction?.reserve_price ?? 0,
    bidCount,
    auctionEndsAt: auction?.ends_at ? new Date(auction.ends_at) : new Date(),
    isLive,
    aiScore: row.ai_condition_score ?? 0,
    estimatedValue: row.ai_market_value ?? 0,
    repairCost: row.ai_repair_cost ?? 0,
    profitPotential: row.ai_profit_potential ?? 0,
  };
}

const Index = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const dbVehiclesRef = useRef<Vehicle[]>([]);

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, auctions(*, bids(count))")
      .eq("status", "approved");

    const dbVehicles = (!error && data) ? data.map(dbToVehicle) : [];
    dbVehiclesRef.current = dbVehicles;
    setVehicles([...dbVehicles, ...mockVehicles]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();

    // Subscribe to realtime auction updates (bid amount, end time changes)
    const channel = supabase
      .channel("homepage-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "auctions" },
        (payload) => {
          const updated = payload.new as any;
          setVehicles((prev) =>
            prev.map((v) => {
              // Match by checking if this vehicle's auction was updated
              const isMatch =
                dbVehiclesRef.current.some(
                  (dbV) => dbV.id === v.id
                ) && v.id !== undefined;

              // We need to re-fetch to get accurate joined data
              // But for instant UI update, patch current_bid and ends_at
              if (isMatch) {
                // Find if this auction belongs to this vehicle by refetching
                return v;
              }
              return v;
            })
          );
          // Re-fetch to get accurate joined data
          fetchVehicles();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids" },
        () => {
          // A new bid was placed — re-fetch to update bid counts and current bids
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVehicles]);

  // Prioritize DB vehicles over mock data
  const dbIds = new Set(dbVehiclesRef.current.map((v) => v.id));
  const sortByDbFirst = (a: Vehicle, b: Vehicle) => {
    const aIsDb = dbIds.has(a.id) ? 0 : 1;
    const bIsDb = dbIds.has(b.id) ? 0 : 1;
    return aIsDb - bIsDb;
  };

  const liveVehicles = vehicles.filter((v) => v.isLive).sort(sortByDbFirst);
  const endingSoon = [...vehicles]
    .filter((v) => v.auctionEndsAt > new Date())
    .sort((a, b) => a.auctionEndsAt.getTime() - b.auctionEndsAt.getTime())
    .slice(0, 6);
  const aiPicks = [...vehicles].sort((a, b) => b.aiScore - a.aiScore).slice(0, 6);

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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveVehicles.slice(0, 3).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
              {liveVehicles.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No live auctions right now.</p>
              )}
            </div>
          )}
        </section>

        {/* Section: Ending Soon */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-xl text-foreground">Ending Soon</h2>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {endingSoon.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
              {endingSoon.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No auctions ending soon.</p>
              )}
            </div>
          )}
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiPicks.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
              {aiPicks.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No vehicles available yet.</p>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
