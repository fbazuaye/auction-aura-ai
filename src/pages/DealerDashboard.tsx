import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Car,
  Gavel,
  DollarSign,
  TrendingUp,
  Upload,
  BarChart3,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: string;
  status: string;
  location: string | null;
  reserve_price: number | null;
  created_at: string;
}

interface AuctionRow {
  id: string;
  status: string;
  start_price: number;
  current_bid: number | null;
  starts_at: string;
  ends_at: string;
  winner_id: string | null;
  vehicle_id: string;
  vehicles: { make: string; model: string; year: number } | null;
  bids: { count: number }[];
}

interface BidRow {
  id: string;
  amount: number;
  created_at: string;
  is_auto_bid: boolean;
  auction_id: string;
}

const DealerDashboard = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [recentBids, setRecentBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole("seller"))) {
      navigate("/auth");
    }
  }, [user, authLoading, hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      const [vehiclesRes, auctionsRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, make, model, year, mileage, condition, status, location, reserve_price, created_at")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("auctions")
          .select("id, status, start_price, current_bid, starts_at, ends_at, winner_id, vehicle_id, vehicles(make, model, year), bids(count)")
          .in("vehicle_id", (await supabase.from("vehicles").select("id").eq("seller_id", user.id)).data?.map(v => v.id) || [])
          .order("created_at", { ascending: false }),
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);

      if (auctionsRes.data) {
        const mapped = (auctionsRes.data as any[]).map(a => ({
          ...a,
          vehicles: Array.isArray(a.vehicles) ? a.vehicles[0] : a.vehicles,
        }));
        setAuctions(mapped);

        // Fetch recent bids for these auctions
        const auctionIds = mapped.map(a => a.id);
        if (auctionIds.length > 0) {
          const { data: bidsData } = await supabase
            .from("bids")
            .select("id, amount, created_at, is_auto_bid, auction_id")
            .in("auction_id", auctionIds)
            .order("created_at", { ascending: false })
            .limit(20);
          if (bidsData) setRecentBids(bidsData);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleDeleteVehicle = async (id: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Could not delete vehicle. It may have active auctions.", variant: "destructive" });
    } else {
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast({ title: "Deleted", description: "Vehicle removed successfully." });
    }
  };

  // Stats
  const totalListings = vehicles.length;
  const activeAuctions = auctions.filter(a => a.status === "active").length;
  const totalRevenue = auctions
    .filter(a => a.status === "ended" && a.winner_id)
    .reduce((sum, a) => sum + (a.current_bid || 0), 0);
  const avgSalePrice = auctions.filter(a => a.status === "ended" && a.winner_id).length > 0
    ? totalRevenue / auctions.filter(a => a.status === "ended" && a.winner_id).length
    : 0;

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": case "active": return "default";
      case "pending": case "scheduled": return "secondary";
      case "rejected": case "ended": return "outline";
      default: return "secondary";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dealer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your inventory, auctions, and performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dealer/bulk-upload")}>
              <Upload className="w-4 h-4 mr-2" /> Bulk Upload
            </Button>
            <Button variant="outline" onClick={() => navigate("/dealer/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button variant="hero" onClick={() => navigate("/list-vehicle")}>
              <Car className="w-4 h-4 mr-2" /> List Vehicle
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold font-display text-foreground">{totalListings}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Auctions</p>
                <p className="text-2xl font-bold font-display text-foreground">{activeAuctions}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold font-display text-foreground">${totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Sale Price</p>
                <p className="text-2xl font-bold font-display text-foreground">${avgSalePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="listings">My Listings ({vehicles.length})</TabsTrigger>
            <TabsTrigger value="auctions">My Auctions ({auctions.length})</TabsTrigger>
            <TabsTrigger value="bids">Recent Bids ({recentBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reserve</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No vehicles listed yet. Start by listing your first vehicle!
                        </TableCell>
                      </TableRow>
                    ) : vehicles.map(v => (
                      <TableRow key={v.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{v.make} {v.model}</TableCell>
                        <TableCell>{v.year}</TableCell>
                        <TableCell>{v.mileage.toLocaleString()} mi</TableCell>
                        <TableCell className="capitalize">{v.condition}</TableCell>
                        <TableCell><Badge variant={statusColor(v.status)}>{v.status}</Badge></TableCell>
                        <TableCell>{v.reserve_price ? `$${v.reserve_price.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${v.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/edit-vehicle/${v.id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(v.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auctions">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Price</TableHead>
                      <TableHead>Current Bid</TableHead>
                      <TableHead>Bids</TableHead>
                      <TableHead>Ends At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auctions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No auctions yet.
                        </TableCell>
                      </TableRow>
                    ) : auctions.map(a => (
                      <TableRow key={a.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {a.vehicles ? `${a.vehicles.year} ${a.vehicles.make} ${a.vehicles.model}` : "—"}
                        </TableCell>
                        <TableCell><Badge variant={statusColor(a.status)}>{a.status}</Badge></TableCell>
                        <TableCell>${a.start_price.toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-primary">{a.current_bid ? `$${a.current_bid.toLocaleString()}` : "—"}</TableCell>
                        <TableCell>{a.bids?.[0]?.count ?? 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.ends_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bids">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBids.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No bids received yet.
                        </TableCell>
                      </TableRow>
                    ) : recentBids.map(b => (
                      <TableRow key={b.id} className="border-border">
                        <TableCell className="font-bold text-primary">${b.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={b.is_auto_bid ? "secondary" : "default"}>
                            {b.is_auto_bid ? "Auto" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(b.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default DealerDashboard;
