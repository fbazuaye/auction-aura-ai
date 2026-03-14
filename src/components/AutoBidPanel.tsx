import { useState } from "react";
import { Bot, Zap, DollarSign, Target, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutoBidPanelProps {
  auctionId: string;
  currentBid: number;
  bidIncrement: number;
}

const AutoBidPanel = ({ auctionId, currentBid, bidIncrement }: AutoBidPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [maxBudget, setMaxBudget] = useState("");
  const [strategy, setStrategy] = useState("conservative");
  const [maxBids, setMaxBids] = useState("10");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleConfigure = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to use auto-bidding", variant: "destructive" });
      return;
    }
    const budget = parseFloat(maxBudget);
    if (!budget || budget <= currentBid) {
      toast({ title: "Invalid budget", description: "Budget must be higher than the current bid", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-bid", {
        body: { action: "configure", auction_id: auctionId, max_budget: budget, strategy, max_bids: parseInt(maxBids) },
      });
      if (error) throw error;
      setEnabled(true);
      toast({ title: "Auto-bid enabled", description: `Strategy: ${strategy}, Budget: $${budget.toLocaleString()}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-bid", {
        body: { action: "execute", auction_id: auctionId },
      });
      if (error) throw error;
      if (data.success) {
        setLastResult(`Bid placed: $${data.amount?.toLocaleString()} — ${data.reasoning}`);
        toast({ title: "Auto-bid placed!", description: `$${data.amount?.toLocaleString()}` });
      } else {
        setLastResult(data.message + (data.reasoning ? ` — ${data.reasoning}` : ""));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("auto-bid", {
        body: { action: "disable", auction_id: auctionId },
      });
      setEnabled(false);
      setLastResult(null);
      toast({ title: "Auto-bid disabled" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10 space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold text-sm text-foreground">AI Auto-Bid</span>
        <Badge variant="ai" className="ml-auto">Beta</Badge>
      </div>

      {!enabled ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Set your max budget and strategy. AI will bid on your behalf.
          </p>
          <div className="space-y-2">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Max budget"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="pl-8 h-8 text-sm bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">
                    <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Conservative</span>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Moderate</span>
                  </SelectItem>
                  <SelectItem value="aggressive">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Aggressive</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Max bids"
                value={maxBids}
                onChange={(e) => setMaxBids(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleConfigure} disabled={loading}>
            {loading ? "Setting up..." : "Enable Auto-Bid"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-success">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-live" />
            Auto-bid active • {strategy} strategy
          </div>
          {lastResult && (
            <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded">{lastResult}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={handleExecute} disabled={loading}>
              {loading ? "..." : "Bid Now"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs text-accent" onClick={handleDisable} disabled={loading}>
              Disable
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoBidPanel;
