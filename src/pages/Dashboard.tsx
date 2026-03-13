import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gavel,
  Heart,
  Clock,
  Receipt,
  Loader2,
  Car,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BidRow {
  id: string;
  amount: number;
  is_auto_bid: boolean;
  created_at: string;
  auction_id: string;
  auctions: {
    status: string;
    current_bid: number | null;
    ends_at: string;
    vehicles: { make: string; model: string; year: number; id: string } | null;
  } | null;
}

interface SavedRow {
  id: string;
  created_at: string;
  vehicle_id: string;
  vehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    status: string;
    images: string[] | null;
    reserve_price: number | null;
  } | null;
}

interface ActiveAuction {
  id: string;
  start_price: number;
  current_bid: number | null;
  status: string;
  ends_at: string;
  vehicles: { make: string; model: string; year: number; id: string } | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bids, setBids] = useState<BidRow[]>([]);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [bidsRes, savedRes, auctionsRes] = await Promise.all([
      supabase
        .from("bids")
        .select("id, amount, is_auto_bid, created_at, auction_id, auctions(status, current_bid, ends_at, vehicles(make, model, year, id))")
        .eq("bidder_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_vehicles")
        .select("id, created_at, vehicle_id, vehicles(id, make, model, year, mileage, status, images, reserve_price)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("auctions")
        .select("id, start_price, current_bid, status, ends_at, vehicles(make, model, year, id)")
        .in("status", ["active", "scheduled"])
        .order("ends_at", { ascending: true }),
    ]);

    if (bidsRes.data) setBids(bidsRes.data as any);
    if (savedRes.data) setSaved(savedRes.data as any);
    if (auctionsRes.data) setActiveAuctions(auctionsRes.data as any);
    setLoading(false);
  };

  const removeSaved = async (id: string) => {
    const { error } = await supabase.from("saved_vehicles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSaved((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Removed from saved" });
    }
  };

  const bidStatus = (bid: BidRow) => {
    if (!bid.auctions) return <Badge variant="outline">Unknown</Badge>;
    const isWinning = bid.amount === bid.auctions.current_bid;
    const ended = bid.auctions.status === "ended";
    if (ended && isWinning) return <Badge className="bg-green-600 text-white border-0">Won</Badge>;
    if (ended) return <Badge variant="outline">Lost</Badge>;
    if (isWinning) return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Winning</Badge>;
    return <Badge variant="destructive">Outbid</Badge>;
  };

  const timeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const myBidsCount = bids.length;
  const savedCount = saved.length;
  const winningCount = bids.filter((b) => b.auctions && b.amount === b.auctions.current_bid && b.auctions.status !== "ended").length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="container py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Car className="w-7 h-7 text-primary" />
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Gavel, label: "My Bids", value: myBidsCount },
            { icon: Heart, label: "Saved", value: savedCount },
            { icon: Clock, label: "Winning", value: winningCount },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bids" className="space-y-4">
          <TabsList className="bg-secondary w-full justify-start overflow-x-auto">
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="auctions">Active Auctions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* My Bids */}
          <TabsContent value="bids">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-lg">My Bids</CardTitle></CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Gavel className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">You haven't placed any bids yet.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/")}>Browse Auctions</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>My Bid</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time Left</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bids.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium text-foreground">
                              {b.auctions?.vehicles
                                ? `${b.auctions.vehicles.year} ${b.auctions.vehicles.make} ${b.auctions.vehicles.model}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-foreground font-medium">
                              ${b.amount.toLocaleString()}
                              {b.is_auto_bid && <Badge variant="secondary" className="ml-2 text-[10px]">Auto</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {b.auctions?.current_bid ? `$${b.auctions.current_bid.toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell>{bidStatus(b)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {b.auctions ? timeLeft(b.auctions.ends_at) : "—"}
                            </TableCell>
                            <TableCell>
                              {b.auctions?.vehicles && (
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${b.auctions!.vehicles!.id}`)}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved */}
          <TabsContent value="saved">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-lg">Saved Vehicles</CardTitle></CardHeader>
              <CardContent>
                {saved.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Heart className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">No saved vehicles.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/")}>Browse Vehicles</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Mileage</TableHead>
                          <TableHead>Reserve</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saved.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium text-foreground">
                              {s.vehicles ? `${s.vehicles.year} ${s.vehicles.make} ${s.vehicles.model}` : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {s.vehicles ? `${s.vehicles.mileage.toLocaleString()} mi` : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {s.vehicles?.reserve_price ? `$${s.vehicles.reserve_price.toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={s.vehicles?.status === "approved" ? "default" : "outline"}>
                                {s.vehicles?.status ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {s.vehicles && (
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${s.vehicles!.id}`)}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => removeSaved(s.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Auctions */}
          <TabsContent value="auctions">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-lg">Active Auctions</CardTitle></CardHeader>
              <CardContent>
                {activeAuctions.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">No active auctions right now.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Start Price</TableHead>
                          <TableHead>Current Bid</TableHead>
                          <TableHead>Time Left</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeAuctions.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium text-foreground">
                              {a.vehicles ? `${a.vehicles.year} ${a.vehicles.make} ${a.vehicles.model}` : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">${a.start_price.toLocaleString()}</TableCell>
                            <TableCell className="text-foreground font-medium">
                              {a.current_bid ? `$${a.current_bid.toLocaleString()}` : "No bids"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{timeLeft(a.ends_at)}</TableCell>
                            <TableCell>
                              {a.vehicles && (
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${a.vehicles!.id}`)}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History */}
          <TabsContent value="history">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-lg">Transaction History</CardTitle></CardHeader>
              <CardContent>
                {bids.filter((b) => b.auctions?.status === "ended").length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Receipt className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">No completed transactions yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>My Bid</TableHead>
                          <TableHead>Final Price</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bids
                          .filter((b) => b.auctions?.status === "ended")
                          .map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium text-foreground">
                                {b.auctions?.vehicles
                                  ? `${b.auctions.vehicles.year} ${b.auctions.vehicles.make} ${b.auctions.vehicles.model}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-foreground">${b.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {b.auctions?.current_bid ? `$${b.auctions.current_bid.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell>{bidStatus(b)}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {new Date(b.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
