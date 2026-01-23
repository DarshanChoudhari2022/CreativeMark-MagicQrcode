import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, Plus, Trash2, Edit2, MapPin, Loader2, ArrowLeft, Globe, CheckCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LanguageToggle } from "@/components/LanguageToggle";

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  google_review_url: string;
  category?: string;
  created_at: string;
}

const Locations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    google_review_url: "",
    category: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadLocations(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadLocations = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("locations")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from("locations")
          .update(formData)
          .eq("id", editingId)
          .eq("owner_id", user.id);
        if (error) throw error;
        toast({ title: "Asset Updated", description: "Business location synchronized." });
      } else {
        const { error } = await (supabase as any)
          .from("locations")
          .insert([{ ...formData, owner_id: user.id }]);
        if (error) throw error;
        toast({ title: "Asset Created", description: "New location registered." });
      }
      resetForm();
      await loadLocations(user.id);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from("locations")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
      if (error) throw error;
      toast({ title: "Asset Removed", description: "Location deleted from records." });
      await loadLocations(user.id);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", city: "", country: "", google_review_url: "", category: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (location: Location) => {
    setFormData({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      country: location.country || "",
      google_review_url: location.google_review_url,
      category: location.category || ""
    });
    setEditingId(location.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <header className="border-b bg-white italic sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-red-600 rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <img src="/logo.jpg" alt="Logo" className="h-10 w-auto rounded-md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Fleet Locations</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage multiple business branches</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-16 px-10 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Location
          </Button>
        </div>

        {showForm && (
          <Card className="mb-12 border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white max-w-3xl">
            <div className="h-2 bg-red-600 w-full"></div>
            <CardHeader className="pt-10 px-10">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">{editingId ? "Modify Asset" : "Register Asset"}</CardTitle>
              <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed branch configuration</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Branch Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g. Pune City Center"
                      className="h-14 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Retail Showroom"
                      className="h-14 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-red-600" /> Google Review URL *
                  </Label>
                  <Input
                    type="url"
                    value={formData.google_review_url}
                    onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
                    required
                    placeholder="https://g.page/business/review"
                    className="h-14 rounded-2xl border-gray-200 focus:border-red-600 focus:ring-red-100 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <Button type="submit" className="h-16 rounded-2xl bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl shadow-red-100">
                    {editingId ? "Synchronize Changes" : "Confirm Registration"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="h-16 rounded-2xl border-gray-200 text-gray-400 font-black uppercase tracking-widest">
                    Cancel Operation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id} className="border border-gray-100 shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:scale-[1.02] transition-all hover:border-red-500/30">
              <div className="h-24 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                <div className="relative z-10 bg-white p-3 rounded-2xl border border-gray-100">
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">{location.name}</CardTitle>
                <CardDescription className="text-[10px] font-black text-red-600 uppercase tracking-widest">{location.category || "General Business"}</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 overflow-hidden">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Target URL</p>
                    <p className="text-[10px] font-bold text-gray-900 truncate">{location.google_review_url}</p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(location)}
                      className="flex-1 h-12 rounded-xl border-gray-200 text-gray-900 font-black uppercase tracking-widest text-[9px] hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(location.id)}
                      className="flex-1 h-12 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-600 font-black uppercase tracking-widest text-[9px]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Trash
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {locations.length === 0 && !showForm && (
            <div className="col-span-full py-40 text-center bg-gray-50/50 rounded-[4rem] border-4 border-dashed border-gray-100">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Building2 className="h-10 w-10 text-red-100" />
              </div>
              <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Active Fleet Assets</h3>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-2 mb-10">Initialize your first location to deploy system</p>
              <Button onClick={() => setShowForm(true)} className="h-16 px-12 bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-black uppercase tracking-widest rounded-full shadow-2xl transition-all active:scale-95">
                Begin Onboarding
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 border-t border-gray-50 text-center">
        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2026 Creative Mark Precision Systems</p>
      </footer>
    </div>
  );
};

export default Locations;
