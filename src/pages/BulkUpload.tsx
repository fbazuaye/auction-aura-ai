import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, Trash2, FileSpreadsheet, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VehicleEntry {
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
  condition: string;
  location: string;
  description: string;
  reserve_price: string;
  errors?: string[];
}

const emptyEntry = (): VehicleEntry => ({
  make: "", model: "", year: "", mileage: "", vin: "",
  condition: "good", location: "", description: "", reserve_price: "",
});

const CONDITIONS = ["excellent", "good", "fair", "poor", "salvage"];

const validateEntry = (e: VehicleEntry): string[] => {
  const errs: string[] = [];
  if (!e.make.trim()) errs.push("Make required");
  if (!e.model.trim()) errs.push("Model required");
  const yr = parseInt(e.year);
  if (!yr || yr < 1900 || yr > new Date().getFullYear() + 1) errs.push("Invalid year");
  const mi = parseInt(e.mileage);
  if (isNaN(mi) || mi < 0) errs.push("Invalid mileage");
  if (!CONDITIONS.includes(e.condition)) errs.push("Invalid condition");
  if (e.reserve_price && isNaN(parseFloat(e.reserve_price))) errs.push("Invalid reserve price");
  return errs;
};

const BulkUpload = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<VehicleEntry[]>([emptyEntry()]);
  const [csvEntries, setCsvEntries] = useState<VehicleEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("csv");

  useEffect(() => {
    if (!authLoading && (!user || !hasRole("seller"))) {
      navigate("/auth");
    }
  }, [user, authLoading, hasRole, navigate]);

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({ title: "Error", description: "CSV must have a header row and at least one data row.", variant: "destructive" });
        return;
      }
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const parsed: VehicleEntry[] = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim());
        const get = (key: string) => cols[headers.indexOf(key)] || "";
        const entry: VehicleEntry = {
          make: get("make"),
          model: get("model"),
          year: get("year"),
          mileage: get("mileage"),
          vin: get("vin"),
          condition: get("condition") || "good",
          location: get("location"),
          description: get("description"),
          reserve_price: get("reserve_price"),
        };
        entry.errors = validateEntry(entry);
        return entry;
      });
      setCsvEntries(parsed);
      toast({ title: "CSV Parsed", description: `${parsed.length} vehicles found.` });
    };
    reader.readAsText(file);
  };

  const addManualEntry = () => setEntries(prev => [...prev, emptyEntry()]);
  const removeManualEntry = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateManualEntry = (i: number, field: keyof VehicleEntry, val: string) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  };

  const submitEntries = async (data: VehicleEntry[]) => {
    if (!user) return;
    // Validate all
    const validated = data.map(e => ({ ...e, errors: validateEntry(e) }));
    const hasErrors = validated.some(e => (e.errors?.length ?? 0) > 0);
    if (hasErrors) {
      if (tab === "csv") setCsvEntries(validated);
      else setEntries(validated);
      toast({ title: "Validation errors", description: "Please fix the highlighted errors.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const rows = validated.map(e => ({
      make: e.make.trim(),
      model: e.model.trim(),
      year: parseInt(e.year),
      mileage: parseInt(e.mileage),
      vin: e.vin.trim() || null,
      condition: e.condition,
      location: e.location.trim() || null,
      description: e.description.trim() || null,
      reserve_price: e.reserve_price ? parseFloat(e.reserve_price) : null,
      seller_id: user.id,
      status: "pending",
    }));

    const { error } = await supabase.from("vehicles").insert(rows);
    setSubmitting(false);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: `${rows.length} vehicles uploaded successfully.` });
      navigate("/dealer");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dealer")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Bulk Vehicle Upload</h1>
            <p className="text-muted-foreground mt-1">Upload multiple vehicles at once via CSV or manual entry</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="csv">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="w-4 h-4 mr-2" /> Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  CSV columns: make, model, year, mileage, vin, condition, location, description, reserve_price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium">Click to upload CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                </div>

                {csvEntries.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{csvEntries.length} vehicles parsed</p>
                      <Badge variant={csvEntries.some(e => (e.errors?.length ?? 0) > 0) ? "destructive" : "default"}>
                        {csvEntries.filter(e => (e.errors?.length ?? 0) > 0).length} errors
                      </Badge>
                    </div>
                    <div className="max-h-96 overflow-auto rounded border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead>#</TableHead>
                            <TableHead>Make</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Mileage</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvEntries.map((e, i) => (
                            <TableRow key={i} className={`border-border ${(e.errors?.length ?? 0) > 0 ? "bg-destructive/10" : ""}`}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>{e.make}</TableCell>
                              <TableCell>{e.model}</TableCell>
                              <TableCell>{e.year}</TableCell>
                              <TableCell>{e.mileage}</TableCell>
                              <TableCell className="capitalize">{e.condition}</TableCell>
                              <TableCell>
                                {(e.errors?.length ?? 0) > 0 ? (
                                  <span className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {e.errors?.join(", ")}
                                  </span>
                                ) : (
                                  <Check className="w-4 h-4 text-success" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button variant="hero" onClick={() => submitEntries(csvEntries)} disabled={submitting}>
                      {submitting ? "Uploading..." : `Upload ${csvEntries.length} Vehicles`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            {entries.map((entry, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Vehicle #{i + 1}</CardTitle>
                  {entries.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeManualEntry(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {(entry.errors?.length ?? 0) > 0 && (
                    <p className="text-sm text-destructive mb-3 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {entry.errors?.join(", ")}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><Label>Make *</Label><Input value={entry.make} onChange={e => updateManualEntry(i, "make", e.target.value)} placeholder="Toyota" /></div>
                    <div><Label>Model *</Label><Input value={entry.model} onChange={e => updateManualEntry(i, "model", e.target.value)} placeholder="Camry" /></div>
                    <div><Label>Year *</Label><Input type="number" value={entry.year} onChange={e => updateManualEntry(i, "year", e.target.value)} placeholder="2020" /></div>
                    <div><Label>Mileage *</Label><Input type="number" value={entry.mileage} onChange={e => updateManualEntry(i, "mileage", e.target.value)} placeholder="45000" /></div>
                    <div><Label>VIN</Label><Input value={entry.vin} onChange={e => updateManualEntry(i, "vin", e.target.value)} placeholder="Optional" /></div>
                    <div>
                      <Label>Condition *</Label>
                      <Select value={entry.condition} onValueChange={v => updateManualEntry(i, "condition", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Location</Label><Input value={entry.location} onChange={e => updateManualEntry(i, "location", e.target.value)} placeholder="Los Angeles, CA" /></div>
                    <div><Label>Reserve Price</Label><Input type="number" value={entry.reserve_price} onChange={e => updateManualEntry(i, "reserve_price", e.target.value)} placeholder="15000" /></div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Label>Description</Label>
                      <Textarea value={entry.description} onChange={e => updateManualEntry(i, "description", e.target.value)} placeholder="Vehicle description..." rows={2} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={addManualEntry}>
                <Plus className="w-4 h-4 mr-2" /> Add Another Vehicle
              </Button>
              <Button variant="hero" onClick={() => submitEntries(entries)} disabled={submitting}>
                {submitting ? "Uploading..." : `Upload ${entries.length} Vehicle${entries.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default BulkUpload;
