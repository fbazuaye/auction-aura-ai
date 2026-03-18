import { Link } from "react-router-dom";
import { MapPin, Gauge, Zap, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AuctionTimer from "./AuctionTimer";
import type { Vehicle } from "@/data/mockVehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="group block rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {vehicle.isLive && <Badge variant="live">● LIVE</Badge>}
          <Badge variant="ai">
            <Zap className="w-3 h-3 mr-0.5" />
            AI {vehicle.aiScore}
          </Badge>
        </div>
        <div className="absolute bottom-2 right-2">
          <AuctionTimer endsAt={vehicle.auctionEndsAt} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-foreground text-sm truncate">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            {vehicle.mileage.toLocaleString()} mi
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {vehicle.location.split(",")[0]}
          </span>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Bid</p>
            <p className="font-display font-bold text-lg text-foreground tabular-nums">
              {formatPrice(vehicle.currentBid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-success">Profit Potential</p>
            <p className="font-display font-semibold text-sm text-success tabular-nums">
              +{formatPrice(vehicle.profitPotential)}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">{vehicle.bidCount} bids</p>
      </div>
    </Link>
  );
};

export default VehicleCard;
