import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Gauge, Calendar, Hash, Zap, TrendingUp, Wrench, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuctionTimer from "@/components/AuctionTimer";
import AutoBidPanel from "@/components/AutoBidPanel";
import DamageDetection from "@/components/DamageDetection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockVehicles } from "@/data/mockVehicles";

const VehicleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const vehicle = mockVehicles.find((v) => v.id === id);
  const [bidAmount, setBidAmount] = useState(0);
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vehicle not found.</p>
      </div>
    );
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const nextBid = vehicle.currentBid + 500;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container py-4 md:py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Auctions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Image + Specs */}
          <div className="lg:col-span-3 space-y-4">
            {/* Image */}
            <div className="relative rounded-lg overflow-hidden aspect-[16/10]">
              <img
                src={vehicle.image}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              {vehicle.isLive && (
                <Badge variant="live" className="absolute top-3 left-3">● LIVE AUCTION</Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">VIN: {vehicle.vin}</p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Gauge, label: "Mileage", value: `${vehicle.mileage.toLocaleString()} mi` },
                { icon: Calendar, label: "Year", value: vehicle.year },
                { icon: MapPin, label: "Location", value: vehicle.location.split(",")[0] },
                { icon: Hash, label: "Condition", value: vehicle.condition },
              ].map((spec) => (
                <div key={spec.label} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <spec.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{spec.label}</span>
                  </div>
                  <p className="font-display font-semibold text-foreground">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Bid History placeholder */}
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-display font-semibold text-foreground mb-3">Bid History</h3>
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <span className="text-muted-foreground">Bidder #{vehicle.bidCount - i}</span>
                    <span className="font-display font-semibold text-foreground tabular-nums">
                      {formatPrice(vehicle.currentBid - i * 500)}
                    </span>
                    <span className="text-xs text-muted-foreground">{i * 3 + 1}m ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Bidding Console + AI Insights */}
          <div className="lg:col-span-2 space-y-4">
            {/* Bidding Console */}
            <div className="p-5 rounded-lg bg-card border border-primary/20 space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Time Remaining</span>
                <AuctionTimer endsAt={vehicle.auctionEndsAt} />
              </div>

              <div className="text-center py-4 border-y border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current Bid</p>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums">
                  {formatPrice(vehicle.currentBid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{vehicle.bidCount} bids</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="bid"
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => navigate("/auth")}
                >
                  Bid {formatPrice(nextBid + bidAmount)}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((inc) => (
                    <Button key={inc} variant="outline" size="sm" className="text-xs" onClick={() => setBidAmount(prev => prev + inc)}>
                      +{formatPrice(inc)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Auto-bid panel */}
              <AutoBidPanel auctionId={vehicle.id} currentBid={vehicle.currentBid} bidIncrement={500} />
            </div>

            {/* AI Insights Panel */}
            <div className="p-5 rounded-lg bg-card border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">AI Insights</h3>
              </div>

              <div className="space-y-3">
                {[
                  { icon: DollarSign, label: "Est. Market Value", value: formatPrice(vehicle.estimatedValue), color: "text-foreground" },
                  { icon: TrendingUp, label: "Profit Potential", value: `+${formatPrice(vehicle.profitPotential)}`, color: "text-success" },
                  { icon: Wrench, label: "Est. Repair Cost", value: formatPrice(vehicle.repairCost), color: vehicle.repairCost > 0 ? "text-accent" : "text-success" },
                  { icon: Zap, label: "AI Score", value: `${vehicle.aiScore}/100`, color: vehicle.aiScore >= 85 ? "text-success" : "text-foreground" },
                ].map((insight) => (
                  <div key={insight.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <insight.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{insight.label}</span>
                    </div>
                    <span className={`font-display font-bold tabular-nums ${insight.color}`}>{insight.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                Powered by AutoBidX AI • Analysis based on market data and vehicle condition
              </p>
            </div>

            {/* Damage Detection */}
            <div className="p-5 rounded-lg bg-card border border-primary/20">
              <DamageDetection />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default VehicleDetail;
