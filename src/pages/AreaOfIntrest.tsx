import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Plus, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
type AreaOfInterest = {
  id: number; // or string, depending on your DB
  name: string;
};

export default function AreaOfInterestManagement() {
  // --- State ---
  const [areas, setAreas] = useState<AreaOfInterest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- Dialog State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaOfInterest | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { request } = useApi();
  const { toast } = useToast();

  // --- Initial Load ---
  useEffect(() => {
    fetchAreas();
  }, []);

  // --- API Actions ---
  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with your actual endpoint later
      const res = await request("/get_areas_of_interest", "GET");
      
      if (res?.status_code === 200 && Array.isArray(res.data)) {
        setAreas(res.data);
      } else {
        // Fallback for now if API doesn't exist yet
        setAreas([]); 
      }
    } catch (error) {
      console.error("fetchAreas error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editingArea) {
        // Update existing
        res = await request("/update_area_of_interest", "POST", {
          id: editingArea.id,
          name: formData.name,
        });
      } else {
        // Create new
        res = await request("/create_area_of_interest", "POST", {
          name: formData.name,
        });
      }

      if (res?.status_code === 200 || res?.status_code === 201) {
        toast({ title: editingArea ? "Updated successfully" : "Created successfully" });
        setIsDialogOpen(false);
        fetchAreas();
      } else {
        toast({ title: "Operation failed", description: res?.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error saving data", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Area of Interest?")) return;

    try {
      const res = await request("/delete_area_of_interest", "POST", { id });
      if (res?.status_code === 200) {
        toast({ title: "Deleted successfully" });
        fetchAreas();
      } else {
        toast({ title: "Delete failed", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  // --- Helpers ---
  const openDialog = (area?: AreaOfInterest) => {
    if (area) {
      setEditingArea(area);
      setFormData({ name: area.name });
    } else {
      setEditingArea(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Areas of Interest</h2>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Add New
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage List</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : areas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No areas of interest found. Click "Add New" to create one.
                </div>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                      <tr>
                        <th className="p-4 w-[80px]">ID</th>
                        <th className="p-4">Name</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {areas.map((area) => (
                        <tr key={area.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-mono text-xs">{area.id}</td>
                          <td className="p-4 font-medium">{area.name}</td>
                          <td className="p-4 text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openDialog(area)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive/90"
                              onClick={() => handleDelete(area.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Edit Area of Interest" : "Add Area of Interest"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Area Name</Label>
              <Input
                id="name"
                placeholder="e.g., Digital Pathology"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}