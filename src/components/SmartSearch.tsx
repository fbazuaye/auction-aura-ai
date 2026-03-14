import { useState } from "react";
import { Search, Sparkles, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SearchFilters {
  make?: string;
  model?: string;
  min_year?: number;
  max_year?: number;
  max_price?: number;
  min_price?: number;
  max_mileage?: number;
  condition?: string;
  sort_by?: string;
  keywords?: string[];
}

interface SmartSearchResult {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: string;
  images: string[];
  ai_condition_score: number | null;
  ai_market_value: number | null;
  auctions: { id: string; current_bid: number; ends_at: string; status: string }[];
}

const SmartSearch = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-search", {
        body: { query: query.trim() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResults(data.vehicles || []);
      setFilters(data.filters || null);
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const suggestions = [
    "Cheap Toyota under $7,000",
    "SUV under 100k miles",
    "Luxury sedan 2022+",
    "Best deals on Honda",
    "Low mileage trucks",
  ];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          placeholder="Try 'cheap Toyota under $7k' or 'SUV under 100k miles'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9 pr-20 bg-secondary border-border h-11"
        />
        <Button
          size="sm"
          variant="hero"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Suggestions */}
      {!searched && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); }}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Active filters */}
      {filters && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          {filters.make && <Badge variant="secondary" className="text-xs">{filters.make}</Badge>}
          {filters.model && <Badge variant="secondary" className="text-xs">{filters.model}</Badge>}
          {filters.max_price && <Badge variant="secondary" className="text-xs">Under {formatPrice(filters.max_price)}</Badge>}
          {filters.max_mileage && <Badge variant="secondary" className="text-xs">&lt;{filters.max_mileage.toLocaleString()} mi</Badge>}
          {filters.condition && <Badge variant="secondary" className="text-xs">{filters.condition}</Badge>}
          {filters.min_year && <Badge variant="secondary" className="text-xs">{filters.min_year}+</Badge>}
          {filters.keywords?.map((k) => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
          <button onClick={() => { setFilters(null); setResults([]); setSearched(false); setQuery(""); }} className="ml-1">
            <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No vehicles match your search</p>
              <p className="text-xs mt-1">Try broader terms or different filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((v) => {
                const auction = v.auctions?.[0];
                return (
                  <div
                    key={v.id}
                    className="rounded-lg bg-card border border-border overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate(`/vehicle/${v.id}`)}
                  >
                    {v.images?.[0] && (
                      <img src={v.images[0]} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <h4 className="font-display font-semibold text-sm text-foreground">{v.year} {v.make} {v.model}</h4>
                      <p className="text-xs text-muted-foreground">{v.mileage.toLocaleString()} mi • {v.condition}</p>
                      {auction && (
                        <p className="font-display font-bold text-foreground mt-1">
                          {formatPrice(auction.current_bid || 0)}
                        </p>
                      )}
                      {v.ai_condition_score && (
                        <Badge variant="ai" className="mt-1 text-[10px]">AI Score: {v.ai_condition_score}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
