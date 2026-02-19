import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit3, Plus, Loader2, Lock, Key, Link } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface EventIntegration {
  id: number;
  event_id: string;
  event_name: string;
  event_unique_code: string;
  api_key: string;
}

interface ExternalEvent {
  event_id: string;
  event_name: string;
}

interface AccessPointData {
  page: string[];
  point: string[];
  user_id: number;
}

export default function EventIntegrationManagement() {
  // --- State: Data ---
  const [integrations, setIntegrations] = useState<EventIntegration[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  
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
  const [editingItem, setEditingItem] = useState<EventIntegration | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    event_id: "",
    event_name: "",
    event_unique_code: "",
    api_key: ""
  });

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
        const hasPageAccess = parsed.page.includes("/event-api"); 
        setCanViewPage(hasPageAccess);

        if (hasPageAccess) {
          fetchIntegrations();
          fetchExternalEvents();
        }

        // 2. Check Action Access
        const pageName = "event-api"; 
        const checkPermission = (action: string) => {
            return parsed.point.includes(action) || parsed.point.includes(`${action}_${pageName}`);
        };

        setCanCreate(checkPermission("create_event_integration"));
        setCanEdit(checkPermission("edit_event_integration"));
        setCanDelete(checkPermission("delete_event_integration"));
      }
    } catch (e) {
      console.error("loadMyAccess error", e);
    }
  };

  // --- API Actions ---
  const fetchExternalEvents = async () => {
    try {
      const response = await fetch('https://api.inditechit.com/get_all_event_details');
      const json = await response.json();
      
      if (json.data && Array.isArray(json.data)) {
        setExternalEvents(json.data);
      } else if (Array.isArray(json)) {
        setExternalEvents(json);
      }
    } catch (error) {
      console.error("Error fetching external events:", error);
      toast({ title: "Failed to load events list", variant: "destructive" });
    }
  };

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await request("/get_event_integrations", "GET");
      
      // Robust check: Handle both raw array OR status_code wrapper
      if (Array.isArray(res)) {
         setIntegrations(res);
      }
      else if (res?.status_code === 200 && Array.isArray(res.data)) {
        setIntegrations(res.data);
      } else {
        setIntegrations([]); 
      }
    } catch (error) {
      console.error("fetchIntegrations error:", error);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic Validation
    if (!formData.event_id || !formData.api_key || !formData.event_unique_code) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editingItem) {
        // UPDATE: Using POST per your backend requirement
        res = await request("/update_event_integration", "POST", {
          id: editingItem.id,
          ...formData
        });
      } else {
        // CREATE
        res = await request("/create_event_integration", "POST", {
          ...formData
        });
      }

      // Check success based on backend response structure
      if (res?.status_code === 200 || res?.status_code === 201) {
        toast({ title: editingItem ? "Updated successfully" : "Created successfully" });
        setIsDialogOpen(false);
        fetchIntegrations(); 
      } else {
        toast({ title: "Operation failed", description: res?.message || "Unknown error", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error saving data", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Integration?")) return;

    try {
      const res = await request("/delete_event_integration", "POST", { id });
      
      if (res?.status_code === 200) {
        toast({ title: "Deleted successfully" });
        fetchIntegrations(); 
      } else {
        toast({ title: "Delete failed", description: res?.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  // --- Helpers ---
  const openDialog = (item?: EventIntegration) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        event_id: String(item.event_id), // Ensure string for matching
        event_name: item.event_name,
        event_unique_code: item.event_unique_code,
        api_key: item.api_key
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        event_id: "",
        event_name: "",
        event_unique_code: "",
        api_key: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleEventSelect = (value: string) => {
    const selectedEvent = externalEvents.find(e => String(e.event_id) === value);
    setFormData(prev => ({
        ...prev,
        event_id: value,
        event_name: selectedEvent ? selectedEvent.event_name : ""
    }));
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
          
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-2xl font-bold tracking-tight">Event Integrations</h2>
            
            {canCreate && (
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" /> Add New
              </Button>
            )}
          </div>

          {/* Table Section */}
          <div className="w-full xl:w-3/4">
            <Card>
                <CardHeader>
                <CardTitle>API Configuration List</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : integrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                    No integrations found. 
                    {canCreate && " Click \"Add New\" to configure one."}
                    </div>
                ) : (
                    <div className="border rounded-md overflow-x-auto">
                    <table className="text-sm text-left w-full min-w-[600px]">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="p-4">Event Name</th>
                            <th className="p-4">Unique Code</th>
                            <th className="p-4">API Key</th>
                            {(canEdit || canDelete) && <th className="p-4 text-right">Actions</th>}
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {integrations.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-2 px-4 font-medium">
                                <div className="flex flex-col">
                                    <span>{item.event_name || "Unknown Event"}</span>
                                    <span className="text-xs text-muted-foreground">ID: {item.event_id}</span>
                                </div>
                            </td>
                            <td className="py-2 px-4">
                                <div className="flex items-center gap-2 bg-muted/40 px-2 py-1 rounded w-fit">
                                    <Link className="w-3 h-3 text-muted-foreground" />
                                    <code className="text-xs font-mono">{item.event_unique_code}</code>
                                </div>
                            </td>
                            <td className="py-2 px-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Key className="w-3 h-3" />
                                    <span className="text-xs font-mono">
                                        {item.api_key.substring(0, 6)}...{item.api_key.slice(-4)}
                                    </span>
                                </div>
                            </td>
                            
                            {(canEdit || canDelete) && (
                                <td className="py-2 px-4 text-right space-x-2">
                                {canEdit && (
                                    <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => openDialog(item)}
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
                                    onClick={() => handleDelete(item.id)}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Integration" : "Add Integration"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            
            {/* Event Selection */}
            <div className="grid gap-2">
              <Label htmlFor="event_select">Select Event</Label>
              {editingItem ? (
                // FIXED: Read-only Input during Edit Mode to ensure visibility
                <div className="relative">
                    <Input 
                        value={formData.event_name || "Event Name Unavailable"} 
                        disabled 
                        className="bg-muted opacity-100 font-medium text-foreground"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                        Event ID: {formData.event_id} (Cannot be changed)
                    </div>
                </div>
              ) : (
                // Dropdown during Create Mode
                <Select 
                    value={formData.event_id} 
                    onValueChange={handleEventSelect}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Choose an event..." />
                    </SelectTrigger>
                    <SelectContent>
                    {externalEvents.length === 0 ? (
                        <div className="p-2 text-xs text-center text-muted-foreground">No events found</div>
                    ) : (
                        externalEvents.map((ev) => (
                        <SelectItem key={ev.event_id} value={String(ev.event_id)}>
                            {ev.event_name}
                        </SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
              )}
            </div>

            {/* Unique Code */}
            <div className="grid gap-2">
              <Label htmlFor="event_unique_code">Event Unique Code</Label>
              <Input
                id="event_unique_code"
                placeholder="e.g. EVT-2024-X99"
                value={formData.event_unique_code}
                onChange={(e) => setFormData({ ...formData, event_unique_code: e.target.value })}
              />
            </div>

            {/* API Key */}
            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="text" 
                placeholder="Paste API Key here"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}