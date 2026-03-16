import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, Car, TrendingUp, Percent } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, CartesianGrid } from "recharts";

const DealerAnalytics = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, sold: 0, revenue: 0, avgPrice: 0, conversionRate: 0 });
  const [statusData, setStatusData] = useState<{ name: string; count: number }[]>([]);
  const [bidActivity, setBidActivity] = useState<{ date: string; bids: number }[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole("seller"))) navigate("/auth");
  }, [user, authLoading, hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      setLoading(true);

      // Get seller's vehicles
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, status")
        .eq("seller_id", user.id);

      if (!vehicles || vehicles.length === 0) {
        setLoading(false);
        return;
      }

      const vehicleIds = vehicles.map(v => v.id);

      // Status distribution
      const statusCounts: Record<string, number> = {};
      vehicles.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
      setStatusData(Object.entries(statusCounts).map(([name, count]) => ({ name, count })));

      // Get auctions for these vehicles
      const { data: auctions } = await supabase
        .from("auctions")
        .select("id, status, current_bid, winner_id")
        .in("vehicle_id", vehicleIds);

      const soldAuctions = (auctions || []).filter(a => a.status === "ended" && a.winner_id);
      const revenue = soldAuctions.reduce((s, a) => s + (a.current_bid || 0), 0);
      const avgPrice = soldAuctions.length > 0 ? revenue / soldAuctions.length : 0;

      setStats({
        total: vehicles.length,
        sold: soldAuctions.length,
        revenue,
        avgPrice,
        conversionRate: vehicles.length > 0 ? (soldAuctions.length / vehicles.length) * 100 : 0,
      });

      // Bid activity over last 30 days
      const auctionIds = (auctions || []).map(a => a.id);
      if (auctionIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: bids } = await supabase
          .from("bids")
          .select("created_at")
          .in("auction_id", auctionIds)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (bids) {
          const dayMap: Record<string, number> = {};
          // Fill all 30 days
          for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dayMap[d.toISOString().split("T")[0]] = 0;
          }
          bids.forEach(b => {
            const day = b.created_at.split("T")[0];
            if (dayMap[day] !== undefined) dayMap[day]++;
          });
          setBidActivity(Object.entries(dayMap).map(([date, bids]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            bids,
          })));
        }
      }

      setLoading(false);
    };
    fetchAnalytics();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  const chartConfig = {
    count: { label: "Vehicles", color: "hsl(var(--primary))" },
    bids: { label: "Bids", color: "hsl(var(--primary))" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dealer")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dealer Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your sales performance and inventory metrics</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Car, label: "Total Listings", value: stats.total, color: "primary" },
            { icon: TrendingUp, label: "Vehicles Sold", value: stats.sold, color: "success" },
            { icon: DollarSign, label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, color: "accent" },
            { icon: DollarSign, label: "Avg Sale Price", value: `$${stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "primary" },
            { icon: Percent, label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, color: "success" },
          ].map((s, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${s.color}/20 flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 text-${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold font-display text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Listings by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">No listing data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Bid Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {bidActivity.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <LineChart data={bidActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="bids" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">No bid activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DealerAnalytics;
