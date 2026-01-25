import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Plus, Loader2, Lock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
type AreaOfInterest = {
  id: number;
  name: string;
};

interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

export default function AreaOfInterestManagement() {
  // --- State: Data ---
  const [areas, setAreas] = useState<AreaOfInterest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- State: Access Control ---
  const [myAccess, setMyAccess] = useState<AccessPointData | null>(null);
  const [canViewPage, setCanViewPage] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // --- State: Dialog ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaOfInterest | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { request } = useApi();
  const { toast } = useToast();

  // --- Initial Load ---
  useEffect(() => {
    loadMyAccess();
  }, []);

  // --- Helpers: Access Control ---
  const getCurrentUserId = (): number => {
    try {
      const raw = localStorage.getItem("user_id");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  };

  const loadMyAccess = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const res: any = await request(`/get_single_access/${userId}`, "GET");
      if (res?.status_code === 200 && res.data) {
        const parsed: AccessPointData = {
          page: JSON.parse(res.data.page),
          point: JSON.parse(res.data.point),
          user_id: Number(res.data.user_id),
        };
        setMyAccess(parsed);

        // 1. Check Page Access
        const hasPageAccess = parsed.page.includes("/areaofintrest");
        setCanViewPage(hasPageAccess);

        if (hasPageAccess) {
          fetchAreas();
        }

        // 2. Check Action Access
        const pageName = "areaofintrest"; 
        
        const checkPermission = (action: string) => {
            return parsed.point.includes(action) || parsed.point.includes(`${action}_${pageName}`);
        };

        setCanCreate(checkPermission("create_aoi"));
        setCanEdit(checkPermission("edit_aoi"));
        setCanDelete(checkPermission("delete_aoi"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
    }
  };

  // --- API Actions ---
  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const res = await request("/get_areas_of_interest", "GET");
      if (res?.status_code === 200 && Array.isArray(res.data)) {
        setAreas(res.data);
      } else {
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
        res = await request("/update_area_of_interest", "POST", {
          id: editingArea.id,
          name: formData.name,
        });
      } else {
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

  // --- Render: Access Denied State ---
  if (myAccess && !canViewPage) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Lock className="w-12 h-12 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
            <p>You do not have permission to view this page.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          
          {/* Header Section: Spans Full Width */}
          <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-2xl font-bold tracking-tight">Areas of Interest</h2>
            
            {canCreate && (
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" /> Add New
              </Button>
            )}
          </div>

          {/* Table Section: Half Width on Large Screens */}
          <div className="w-full lg:w-1/2">
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
                    No areas of interest found. 
                    {canCreate && " Click \"Add New\" to create one."}
                    </div>
                ) : (
                    <div className="border rounded-md">
                    <table className="text-sm text-left w-full">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="p-4">Name</th>
                            {(canEdit || canDelete) && <th className="p-4 text-right">Actions</th>}
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {areas.map((area) => (
                            <tr key={area.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-1 px-4 font-medium">{area.name}</td>
                            
                            {(canEdit || canDelete) && (
                                <td className="py-1 px-4 text-right space-x-2">
                                {canEdit && (
                                    <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => openDialog(area)}
                                    className="h-8 w-8"
                                    >
                                    <Edit3 className="h-4 w-4" />
                                    </Button>
                                )}
                                
                                {canDelete && (
                                    <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive/90 h-8 w-8"
                                    onClick={() => handleDelete(area.id)}
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                </td>
                            )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
                </CardContent>
            </Card>
          </div>
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