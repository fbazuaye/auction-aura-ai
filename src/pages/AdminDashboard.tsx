import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Users,
  Car,
  Gavel,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
  Pencil,
} from "lucide-react";

interface SellerRequest {
  user_id: string;
  role: string;
  profiles: { full_name: string | null; avatar_url: string | null; created_at: string } | null;
}

interface VehicleListing {
  id: string;
  make: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  seller_id: string;
  reserve_price: number | null;
  location: string | null;
}

interface AuctionRow {
  id: string;
  start_price: number;
  current_bid: number | null;
  status: string;
  starts_at: string;
  ends_at: string;
  live_stream_url: string | null;
  vehicles: { make: string; model: string; year: number } | null;
}

const AdminDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sellers, setSellers] = useState<SellerRequest[]>([]);
  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalVehicles: 0, activeAuctions: 0, totalBids: 0 });

  useEffect(() => {
    if (!authLoading && (!user || !hasRole("admin"))) {
      navigate("/");
      toast({ title: "Access denied", description: "Admin privileges required.", variant: "destructive" });
    }
  }, [user, authLoading, hasRole]);

  useEffect(() => {
    if (user && hasRole("admin")) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const [sellersRes, vehiclesRes, auctionsRes, profilesCount, vehiclesCount, auctionsCount, bidsCount] =
      await Promise.all([
        supabase
          .from("user_roles")
          .select("user_id, role, profiles(full_name, avatar_url, created_at)")
          .eq("role", "seller" as any),
        supabase
          .from("vehicles")
          .select("id, make, model, year, status, created_at, seller_id, reserve_price, location")
          .order("created_at", { ascending: false }),
        supabase
          .from("auctions")
          .select("id, start_price, current_bid, status, starts_at, ends_at, live_stream_url, vehicles(make, model, year)")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("auctions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("bids").select("id", { count: "exact", head: true }),
      ]);

    if (sellersRes.data) setSellers(sellersRes.data as any);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (auctionsRes.data) setAuctions(auctionsRes.data as any);
    setStats({
      totalUsers: profilesCount.count ?? 0,
      totalVehicles: vehiclesCount.count ?? 0,
      activeAuctions: auctionsCount.count ?? 0,
      totalBids: bidsCount.count ?? 0,
    });
    setLoading(false);
  };

  const approveVehicle = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from("vehicles").update({ status: "approved" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehicle approved" });
      fetchData();
    }
    setActionLoading(null);
  };

  const rejectVehicle = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from("vehicles").update({ status: "rejected" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehicle rejected" });
      fetchData();
    }
    setActionLoading(null);
  };

  const grantSellerRole = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "seller" as any });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Seller role granted" });
      fetchData();
    }
    setActionLoading(null);
  };

  const revokeSellerRole = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "seller" as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Seller role revoked" });
      fetchData();
    }
    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      active: { variant: "default", label: "Active" },
      scheduled: { variant: "secondary", label: "Scheduled" },
      ended: { variant: "outline", label: "Ended" },
    };
    const s = map[status] ?? { variant: "outline" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 space-y-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <h1 className="font-display font-bold text-2xl text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers },
            { icon: Car, label: "Vehicles", value: stats.totalVehicles },
            { icon: Gavel, label: "Active Auctions", value: stats.activeAuctions },
            { icon: TrendingUp, label: "Total Bids", value: stats.totalBids },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vehicles" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="vehicles">Listings</TabsTrigger>
            <TabsTrigger value="sellers">Sellers</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg">Vehicle Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No vehicle listings yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reserve</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Listed</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicles.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium text-foreground">
                              {v.year} {v.make} {v.model}
                            </TableCell>
                            <TableCell>{statusBadge(v.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {v.reserve_price ? `$${v.reserve_price.toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{v.location || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(v.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/edit-vehicle/${v.id}`)}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              {v.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => approveVehicle(v.id)}
                                    disabled={actionLoading === v.id}
                                  >
                                    {actionLoading === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectVehicle(v.id)}
                                    disabled={actionLoading === v.id}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
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

          {/* Sellers Tab */}
          <TabsContent value="sellers">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg">Seller Management</CardTitle>
              </CardHeader>
              <CardContent>
                {sellers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No sellers registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sellers.map((s) => (
                          <TableRow key={s.user_id}>
                            <TableCell className="font-medium text-foreground">
                              {s.profiles?.full_name || "Unnamed User"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {s.profiles?.created_at ? new Date(s.profiles.created_at).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => revokeSellerRole(s.user_id)}
                                disabled={actionLoading === s.user_id}
                              >
                                {actionLoading === s.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                                Revoke
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

          {/* Auctions Tab */}
          <TabsContent value="auctions">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg">Auctions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {auctions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No auctions created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Price</TableHead>
                          <TableHead>Current Bid</TableHead>
                          <TableHead>Starts</TableHead>
                          <TableHead>Ends</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auctions.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium text-foreground">
                              {a.vehicles ? `${a.vehicles.year} ${a.vehicles.make} ${a.vehicles.model}` : "—"}
                            </TableCell>
                            <TableCell>{statusBadge(a.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              ${a.start_price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-foreground font-medium">
                              {a.current_bid ? `$${a.current_bid.toLocaleString()}` : "No bids"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(a.starts_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(a.ends_at).toLocaleDateString()}
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
    </div>
  );
};

export default AdminDashboard;
