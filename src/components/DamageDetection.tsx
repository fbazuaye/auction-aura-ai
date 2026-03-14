import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DamageItem {
  area: string;
  type: string;
  severity: "minor" | "moderate" | "severe";
  estimated_repair_cost: number;
  description: string;
}

interface DamageReport {
  overall_condition: string;
  overall_score: number;
  damages: DamageItem[];
  total_repair_cost: number;
  summary: string;
}

const DamageDetection = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DamageReport | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setReport(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imagePreview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-damage", {
        body: { image_url: imagePreview },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setReport(data as DamageReport);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "minor": return "bg-success/20 text-success border-success/30";
      case "moderate": return "bg-primary/20 text-primary border-primary/30";
      case "severe": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-foreground">AI Damage Detection</h3>
        <Badge variant="ai">AI Powered</Badge>
      </div>

      {/* Upload area */}
      {!imagePreview ? (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Upload a vehicle image to detect damage</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img src={imagePreview} alt="Vehicle" className="w-full h-48 object-cover rounded-lg" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 h-7 w-7"
            onClick={() => { setImagePreview(null); setReport(null); }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      {imagePreview && !report && (
        <Button onClick={analyze} disabled={loading} className="w-full" variant="hero">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Camera className="w-4 h-4 mr-2" /> Detect Damage</>
          )}
        </Button>
      )}

      {/* Results */}
      {report && (
        <div className="space-y-3 animate-in fade-in duration-500">
          {/* Overall score */}
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Condition Score</span>
              <span className="font-display font-bold text-foreground">{report.overall_score}/100</span>
            </div>
            <Progress value={report.overall_score} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <Badge className={severityColor(report.overall_condition === "excellent" || report.overall_condition === "good" ? "minor" : report.overall_condition === "fair" ? "moderate" : "severe")}>
                {report.overall_condition.toUpperCase()}
              </Badge>
              <span className="font-display font-semibold text-accent text-sm">
                Est. Repair: {formatPrice(report.total_repair_cost)}
              </span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">{report.summary}</p>

          {/* Damage items */}
          {report.damages.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-display font-semibold text-foreground flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-accent" /> Detected Issues ({report.damages.length})
              </h4>
              {report.damages.map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{d.area}</span>
                    <Badge className={`text-[10px] ${severityColor(d.severity)}`}>{d.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.type} — {d.description}</p>
                  <p className="text-xs font-display font-semibold text-accent mt-1">
                    Repair: {formatPrice(d.estimated_repair_cost)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-success">No significant damage detected</span>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={() => { setImagePreview(null); setReport(null); }}>
            Analyze Another Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default DamageDetection;
