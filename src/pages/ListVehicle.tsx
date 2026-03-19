import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Car,
  Upload,
  DollarSign,
  Clock,
  Loader2,
  ImagePlus,
  X,
  Sparkles,
  Video,
  Play,
  Pause,
  Square,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ListVehicle = () => {
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: 0,
    vin: "",
    condition: "good",
    location: "",
    description: "",
    reserve_price: 0,
    body_style: "",
    exterior_color: "",
    interior_color: "",
    engine_type: "",
    transmission: "",
    drive_type: "",
    fuel_type: "",
    cylinders: "",
    title_status: "",
    primary_damage: "",
    secondary_damage: "",
    keys_available: true,
    highlights: [] as string[],
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [createAuction, setCreateAuction] = useState(false);
  const [auctionSettings, setAuctionSettings] = useState({
    start_price: 0,
    bid_increment: 100,
    duration_hours: 24,
    live_stream_url: "",
  });
  const [auctionStatus, setAuctionStatus] = useState<string>("scheduled");
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const canList = hasRole("seller") || hasRole("admin");

  // Fetch existing vehicle data in edit mode
  useEffect(() => {
    if (!editId || !user) return;
    const fetchVehicle = async () => {
      setFetchingVehicle(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", editId)
        .single();
      if (error || !data) {
        toast({ title: "Vehicle not found", variant: "destructive" });
        navigate("/dealer");
        return;
      }
      if (data.seller_id !== user.id && !hasRole("admin")) {
        toast({ title: "Not authorized to edit this vehicle", variant: "destructive" });
        navigate("/dealer");
        return;
      }
      setForm({
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        vin: data.vin || "",
        condition: data.condition,
        location: data.location || "",
        description: data.description || "",
        reserve_price: data.reserve_price ? Number(data.reserve_price) : 0,
        body_style: (data as any).body_style || "",
        exterior_color: (data as any).exterior_color || "",
        interior_color: (data as any).interior_color || "",
        engine_type: (data as any).engine_type || "",
        transmission: (data as any).transmission || "",
        drive_type: (data as any).drive_type || "",
        fuel_type: (data as any).fuel_type || "",
        cylinders: (data as any).cylinders ? String((data as any).cylinders) : "",
        title_status: (data as any).title_status || "",
        primary_damage: (data as any).primary_damage || "",
        secondary_damage: (data as any).secondary_damage || "",
        keys_available: (data as any).keys_available !== false,
        highlights: (data as any).highlights || [],
      });
      setExistingImageUrls(data.images || []);
      setExistingVideoUrls(data.videos || []);

      // Fetch existing auction data
      const { data: auctionData } = await supabase
        .from("auctions")
        .select("*")
        .eq("vehicle_id", editId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (auctionData) {
        setCreateAuction(true);
        setAuctionId(auctionData.id);
        setAuctionStatus(auctionData.status);
        const durationMs = new Date(auctionData.ends_at).getTime() - new Date(auctionData.starts_at).getTime();
        const durationHours = Math.round(durationMs / 3600000);
        setAuctionSettings({
          start_price: Number(auctionData.start_price) || 0,
          bid_increment: Number(auctionData.bid_increment) || 100,
          duration_hours: durationHours || 24,
          live_stream_url: auctionData.live_stream_url || "",
        });
      }

      setFetchingVehicle(false);
    };
    fetchVehicle();
  }, [editId, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImageUrls.length + images.length + files.length;
    if (totalImages > 10) {
      toast({ title: "Maximum 10 images allowed", variant: "destructive" });
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalVideos = existingVideoUrls.length + videos.length + files.length;
    if (totalVideos > 3) {
      toast({ title: "Maximum 3 videos allowed", variant: "destructive" });
      return;
    }
    const oversized = files.find((f) => f.size > 100 * 1024 * 1024);
    if (oversized) {
      toast({ title: "Each video must be under 100MB", variant: "destructive" });
      return;
    }
    setVideos((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setVideoPreviews((prev) => [...prev, url]);
    });
  };

  const removeVideo = (idx: number) => {
    URL.revokeObjectURL(videoPreviews[idx]);
    setVideos((prev) => prev.filter((_, i) => i !== idx));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingVideo = (idx: number) => {
    setExistingVideoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const runAiAnalysis = async () => {
    if (!form.make || !form.model || !form.year) {
      toast({ title: "Fill in make, model, and year first", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-vehicle", {
        body: {
          make: form.make,
          model: form.model,
          year: form.year,
          mileage: form.mileage,
          condition: form.condition,
          location: form.location,
        },
      });
      if (error) throw error;
      setAiAnalysis(data);
      toast({ title: "AI analysis complete!" });
    } catch (err: any) {
      toast({ title: "AI analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAuctionStatusChange = async (newStatus: string) => {
    if (!auctionId) return;
    setStatusLoading(true);
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === "ended") {
        updateData.ends_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("auctions")
        .update(updateData)
        .eq("id", auctionId);
      if (error) throw error;
      setAuctionStatus(newStatus);
      toast({ title: `Auction ${newStatus}`, description: `Auction status changed to ${newStatus}.` });
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-media")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("vehicle-media")
          .getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Upload new videos
      const uploadedVideoUrls: string[] = [];
      for (const file of videos) {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-media")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("vehicle-media")
          .getPublicUrl(filePath);
        uploadedVideoUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImageUrls, ...uploadedUrls];
      const allVideos = [...existingVideoUrls, ...uploadedVideoUrls];

      const vehicleData = {
        make: form.make,
        model: form.model,
        year: form.year,
        mileage: form.mileage,
        vin: form.vin || null,
        condition: form.condition,
        location: form.location || null,
        description: form.description || null,
        reserve_price: form.reserve_price || null,
        images: allImages,
        videos: allVideos,
        ai_market_value: aiAnalysis?.market_value || null,
        ai_condition_score: aiAnalysis?.condition_score || null,
        ai_repair_cost: aiAnalysis?.repair_cost || null,
        ai_profit_potential: aiAnalysis?.profit_potential || null,
        body_style: form.body_style || null,
        exterior_color: form.exterior_color || null,
        interior_color: form.interior_color || null,
        engine_type: form.engine_type || null,
        transmission: form.transmission || null,
        drive_type: form.drive_type || null,
        fuel_type: form.fuel_type || null,
        cylinders: form.cylinders ? Number(form.cylinders) : null,
        title_status: form.title_status || null,
        primary_damage: form.primary_damage || null,
        secondary_damage: form.secondary_damage || null,
        keys_available: form.keys_available,
        highlights: form.highlights.length > 0 ? form.highlights : null,
      } as any;

      if (isEditMode && editId) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", editId);
        if (updateError) throw updateError;

        // Update auction settings if auction exists
        if (createAuction) {
          const { error: auctionUpdateError } = await supabase
            .from("auctions")
            .update({
              start_price: auctionSettings.start_price,
              bid_increment: auctionSettings.bid_increment,
              reserve_price: form.reserve_price || null,
              live_stream_url: auctionSettings.live_stream_url || null,
            } as any)
            .eq("vehicle_id", editId);
          if (auctionUpdateError) throw auctionUpdateError;
        }

        toast({ title: "Vehicle updated!", description: "Your listing has been updated successfully." });
        navigate(`/vehicle/${editId}`);
      } else {
        // Insert new vehicle
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .insert({
            ...vehicleData,
            seller_id: user.id,
            status: "pending",
          })
          .select()
          .single();

        if (vehicleError) throw vehicleError;

        // Create auction if enabled
        if (createAuction && vehicle) {
          const startsAt = new Date();
          const endsAt = new Date(startsAt.getTime() + auctionSettings.duration_hours * 3600000);
          const { error: auctionError } = await supabase.from("auctions").insert({
            vehicle_id: vehicle.id,
            start_price: auctionSettings.start_price,
            reserve_price: form.reserve_price || null,
            bid_increment: auctionSettings.bid_increment,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            original_end_time: endsAt.toISOString(),
            status: "active",
            live_stream_url: auctionSettings.live_stream_url || null,
          } as any);
          if (auctionError) throw auctionError;
        }

        toast({ title: "Vehicle listed!", description: "Your listing is pending admin approval." });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchingVehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canList) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center space-y-4">
          <Car className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="font-display font-bold text-2xl text-foreground">Seller Access Required</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You need a seller account to list vehicles. Contact an admin to get approved as a seller.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
        </main>
      </div>
    );
  }

  const totalImages = existingImageUrls.length + images.length;
  const totalVideos = existingVideoUrls.length + videos.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Upload className="w-7 h-7 text-primary" />
          <h1 className="font-display font-bold text-2xl text-foreground">
            {isEditMode ? "Edit Vehicle" : "List a Vehicle"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input placeholder="Toyota" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input placeholder="Camry" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" min={1900} max={2030} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Mileage *</Label>
                <Input type="number" min={0} placeholder="45000" value={form.mileage || ""} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input placeholder="1HGBH41JXMN109186" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="salvage">Salvage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="Los Angeles, CA" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Reserve Price ($)</Label>
                <Input type="number" min={0} placeholder="15000" value={form.reserve_price || ""} onChange={(e) => setForm({ ...form, reserve_price: Number(e.target.value) })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the vehicle condition, features, history..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border min-h-[100px]" />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Specifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Vehicle Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Body Style</Label>
                <Select value={form.body_style} onValueChange={(v) => setForm({ ...form, body_style: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select body style" /></SelectTrigger>
                  <SelectContent>
                    {["Sedan", "SUV", "Truck", "Coupe", "Convertible", "Van", "Wagon", "Hatchback"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exterior Color</Label>
                <Input placeholder="e.g. Silver" value={form.exterior_color} onChange={(e) => setForm({ ...form, exterior_color: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Interior Color</Label>
                <Input placeholder="e.g. Black" value={form.interior_color} onChange={(e) => setForm({ ...form, interior_color: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Engine Type</Label>
                <Input placeholder="e.g. 2.5L 4-Cylinder" value={form.engine_type} onChange={(e) => setForm({ ...form, engine_type: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Transmission</Label>
                <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                  <SelectContent>
                    {["Automatic", "Manual", "CVT"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Drive Type</Label>
                <Select value={form.drive_type} onValueChange={(v) => setForm({ ...form, drive_type: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select drive type" /></SelectTrigger>
                  <SelectContent>
                    {["FWD", "RWD", "AWD", "4WD"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                  <SelectContent>
                    {["Gasoline", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cylinders</Label>
                <Select value={form.cylinders} onValueChange={(v) => setForm({ ...form, cylinders: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select cylinders" /></SelectTrigger>
                  <SelectContent>
                    {["3", "4", "5", "6", "8", "10", "12"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Title & Damage Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" /> Title & Damage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title Status</Label>
                <Select value={form.title_status} onValueChange={(v) => setForm({ ...form, title_status: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select title status" /></SelectTrigger>
                  <SelectContent>
                    {["Clean", "Salvage", "Rebuilt", "Flood", "Lemon"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Damage</Label>
                <Select value={form.primary_damage} onValueChange={(v) => setForm({ ...form, primary_damage: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select primary damage" /></SelectTrigger>
                  <SelectContent>
                    {["None", "Front End", "Rear End", "Side", "Rollover", "Vandalism", "Hail", "Flood", "Mechanical"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secondary Damage</Label>
                <Select value={form.secondary_damage} onValueChange={(v) => setForm({ ...form, secondary_damage: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select secondary damage" /></SelectTrigger>
                  <SelectContent>
                    {["None", "Front End", "Rear End", "Side", "Rollover", "Vandalism", "Hail", "Flood", "Mechanical"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center gap-3 pt-6">
                <Switch id="keys-toggle" checked={form.keys_available} onCheckedChange={(v) => setForm({ ...form, keys_available: v })} />
                <Label htmlFor="keys-toggle">Keys Available</Label>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Highlights</Label>
                <div className="flex flex-wrap gap-2">
                  {["Run & Drive", "Enhanced Vehicle", "Donation", "Rental", "Government", "Recovered Theft", "Repossession"].map(h => (
                    <Badge
                      key={h}
                      variant={form.highlights.includes(h) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        highlights: prev.highlights.includes(h)
                          ? prev.highlights.filter(x => x !== h)
                          : [...prev.highlights, h],
                      }))}
                    >
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-primary" /> Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {existingImageUrls.map((src, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={src} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                ))}
                {imagePreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                ))}
                {totalImages < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{totalImages}/10 photos</p>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {existingVideoUrls.map((src, i) => (
                  <div key={`existing-v-${i}`} className="relative rounded-lg overflow-hidden border border-border">
                    <video src={src} className="w-full aspect-video object-cover" controls />
                    <button type="button" onClick={() => removeExistingVideo(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                ))}
                {videoPreviews.map((src, i) => (
                  <div key={`new-v-${i}`} className="relative rounded-lg overflow-hidden border border-border">
                    <video src={src} className="w-full aspect-video object-cover" />
                    <button type="button" onClick={() => removeVideo(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                ))}
                {totalVideos < 3 && (
                  <label className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Video className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Add Video</span>
                    <input type="file" accept="video/mp4,video/webm" multiple onChange={handleVideoUpload} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{totalVideos}/3 videos (max 100MB each, mp4/webm)</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Vehicle Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="outline" onClick={runAiAnalysis} disabled={aiLoading} className="w-full">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {aiLoading ? "Analyzing..." : "Run AI Analysis"}
              </Button>
              {aiAnalysis && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Market Value</p>
                    <p className="text-lg font-display font-bold text-foreground">${aiAnalysis.market_value?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Condition Score</p>
                    <p className="text-lg font-display font-bold text-foreground">{aiAnalysis.condition_score}/10</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Repair Cost</p>
                    <p className="text-lg font-display font-bold text-foreground">${aiAnalysis.repair_cost?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">Profit Potential</p>
                    <p className="text-lg font-display font-bold text-foreground">{aiAnalysis.profit_potential}/10</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Recommended Bid Range</p>
                    <p className="text-lg font-display font-bold text-foreground">
                      ${aiAnalysis.bid_range_low?.toLocaleString()} – ${aiAnalysis.bid_range_high?.toLocaleString()}
                    </p>
                  </div>
                  {aiAnalysis.summary && (
                    <div className="p-3 rounded-lg bg-secondary sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">AI Summary</p>
                      <p className="text-sm text-foreground">{aiAnalysis.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auction Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Auction Settings
                </span>
                {!isEditMode && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auction-toggle" className="text-sm font-normal text-muted-foreground">Create auction</Label>
                    <Switch id="auction-toggle" checked={createAuction} onCheckedChange={setCreateAuction} />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            {isEditMode && hasRole("admin") && auctionId && (
              <div className="px-6 pb-4 flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={auctionStatus === "active" ? "default" : auctionStatus === "ended" ? "destructive" : "secondary"} className="capitalize">
                  {auctionStatus}
                </Badge>
                <div className="flex gap-2 ml-auto">
                  {auctionStatus !== "active" && auctionStatus !== "ended" && (
                    <Button type="button" size="sm" variant="success" disabled={statusLoading} onClick={() => handleAuctionStatusChange("active")}>
                      <Play className="w-3 h-3 mr-1" /> Activate
                    </Button>
                  )}
                  {auctionStatus === "active" && (
                    <>
                      <Button type="button" size="sm" variant="secondary" disabled={statusLoading} onClick={() => handleAuctionStatusChange("paused")}>
                        <Pause className="w-3 h-3 mr-1" /> Pause
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="destructive" disabled={statusLoading}>
                            <Square className="w-3 h-3 mr-1" /> End
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End this auction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The auction will be permanently ended and no further bids will be accepted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAuctionStatusChange("ended")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              End Auction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {auctionStatus === "paused" && (
                    <>
                      <Button type="button" size="sm" variant="success" disabled={statusLoading} onClick={() => handleAuctionStatusChange("active")}>
                        <Play className="w-3 h-3 mr-1" /> Resume
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="destructive" disabled={statusLoading}>
                            <Square className="w-3 h-3 mr-1" /> End
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End this auction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The auction will be permanently ended and no further bids will be accepted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAuctionStatusChange("ended")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              End Auction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            )}
            {(createAuction || isEditMode) && (
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Price ($) *</Label>
                  <Input type="number" min={0} placeholder="5000" value={auctionSettings.start_price || ""} onChange={(e) => setAuctionSettings({ ...auctionSettings, start_price: Number(e.target.value) })} required className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Bid Increment ($)</Label>
                  <Input type="number" min={1} value={auctionSettings.bid_increment} onChange={(e) => setAuctionSettings({ ...auctionSettings, bid_increment: Number(e.target.value) })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <Select value={String(auctionSettings.duration_hours)} onValueChange={(v) => setAuctionSettings({ ...auctionSettings, duration_hours: Number(v) })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <Label>Live Stream URL (optional)</Label>
                  <Input placeholder="https://youtube.com/live/... or https://twitch.tv/..." value={auctionSettings.live_stream_url} onChange={(e) => setAuctionSettings({ ...auctionSettings, live_stream_url: e.target.value })} className="bg-secondary border-border" />
                  <p className="text-xs text-muted-foreground">Paste a YouTube Live or Twitch stream URL to embed a live video feed during the auction</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="w-5 h-5 mr-2" />}
            {loading
              ? "Submitting..."
              : isEditMode
                ? "Update Vehicle"
                : createAuction
                  ? "List Vehicle & Start Auction"
                  : "List Vehicle"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ListVehicle;
